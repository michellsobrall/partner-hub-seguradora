package com.partnerhub.service;

import com.partnerhub.domain.entity.Broker;
import com.partnerhub.domain.entity.CommissionEntry;
import com.partnerhub.domain.entity.CommissionRule;
import com.partnerhub.domain.entity.CsvImportBatch;
import com.partnerhub.domain.entity.PolicySale;
import com.partnerhub.domain.enums.BatchImportStatus;
import com.partnerhub.domain.enums.CommissionEntryStatus;
import com.partnerhub.domain.enums.CommissionType;
import com.partnerhub.domain.enums.SaleCalculationStatus;
import com.partnerhub.dto.commission.*;
import com.partnerhub.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommissionEngineService {

    private static final Logger log = LoggerFactory.getLogger(CommissionEngineService.class);

    private final CommissionRuleRepository ruleRepository;
    private final CsvImportBatchRepository batchRepository;
    private final PolicySaleRepository saleRepository;
    private final CommissionEntryRepository entryRepository;
    private final BrokerRepository brokerRepository;

    public CommissionEngineService(
            CommissionRuleRepository ruleRepository,
            CsvImportBatchRepository batchRepository,
            PolicySaleRepository saleRepository,
            CommissionEntryRepository entryRepository,
            BrokerRepository brokerRepository
    ) {
        this.ruleRepository = ruleRepository;
        this.batchRepository = batchRepository;
        this.saleRepository = saleRepository;
        this.entryRepository = entryRepository;
        this.brokerRepository = brokerRepository;
    }

    /**
     * Job em Background que executa automaticamente a cada 20 segundos
     * para processar vendas pendentes e transformá-las em comissões apuradas.
     */
    @Scheduled(fixedDelay = 20000, initialDelay = 4000)
    @Transactional
    public void scheduledCommissionCalculation() {
        long pendingCount = saleRepository.countByCalculationStatus(SaleCalculationStatus.PENDING);
        if (pendingCount > 0) {
            log.info("[CommissionEngine] Encontradas {} vendas pendentes. Iniciando cálculo em background...", pendingCount);
            EngineExecutionResultDto result = executeCalculationEngine();
            log.info("[CommissionEngine] Apuração concluída: {} comissões geradas (R$ {}).",
                    result.getCalculatedEntries(), result.getGeneratedAmount());
        }
    }

    @Transactional
    public EngineExecutionResultDto executeCalculationEngine() {
        List<PolicySale> pendingSales = new ArrayList<>();
        pendingSales.addAll(saleRepository.findByCalculationStatusOrderByCreatedAtAsc(SaleCalculationStatus.PENDING));
        pendingSales.addAll(saleRepository.findByCalculationStatusOrderByCreatedAtAsc(SaleCalculationStatus.NO_MATCHING_RULE));

        int processed = 0;
        int calculated = 0;
        int unmatched = 0;
        BigDecimal totalGenerated = BigDecimal.ZERO;

        for (PolicySale sale : pendingSales) {
            processed++;

            if (entryRepository.existsBySaleId(sale.getId())) {
                sale.setCalculationStatus(SaleCalculationStatus.CALCULATED);
                saleRepository.save(sale);
                continue;
            }

            Optional<CommissionRule> ruleOpt = ruleRepository
                    .findFirstByOperatorNameIgnoreCaseAndProductNameIgnoreCaseAndActiveTrue(
                            sale.getOperatorName().trim(),
                            sale.getProductName().trim()
                    );

            if (ruleOpt.isEmpty()) {
                sale.setCalculationStatus(SaleCalculationStatus.NO_MATCHING_RULE);
                sale.setCalculationNotes("Nenhuma regra ativa para " + sale.getOperatorName() + " / " + sale.getProductName());
                saleRepository.save(sale);
                unmatched++;
                continue;
            }

            CommissionRule rule = ruleOpt.get();
            boolean isAgency = sale.getInstallmentNumber() <= rule.getAgencyInstallments();

            CommissionType commissionType = isAgency ? CommissionType.AGENCY : CommissionType.RECURRING;
            BigDecimal appliedPct = isAgency ? rule.getAgencyPercentage() : rule.getRecurringPercentage();

            BigDecimal commissionAmount = sale.getMonthlyPremium()
                    .multiply(appliedPct)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            CommissionEntry entry = CommissionEntry.builder()
                    .broker(sale.getBroker())
                    .sale(sale)
                    .rule(rule)
                    .referenceMonth(sale.getReferenceMonth())
                    .commissionType(commissionType)
                    .installmentNumber(sale.getInstallmentNumber())
                    .livesCount(sale.getLivesCount())
                    .baseAmount(sale.getMonthlyPremium())
                    .appliedPercentage(appliedPct)
                    .commissionAmount(commissionAmount)
                    .status(CommissionEntryStatus.CALCULATED)
                    .calculatedAt(Instant.now())
                    .build();

            entryRepository.save(entry);

            sale.setCalculationStatus(SaleCalculationStatus.CALCULATED);
            sale.setCalculationNotes("Apurado via regra " + rule.getRuleCode() + " (" + commissionType + " " + appliedPct + "%)");
            saleRepository.save(sale);

            calculated++;
            totalGenerated = totalGenerated.add(commissionAmount);
        }

        return EngineExecutionResultDto.builder()
                .processedSales(processed)
                .calculatedEntries(calculated)
                .unmatchedSales(unmatched)
                .generatedAmount(totalGenerated)
                .executedAt(Instant.now())
                .build();
    }

    @Transactional(readOnly = true)
    public CommissionSummaryDto getSummary() {
        List<CommissionEntry> entries = entryRepository.findAllByOrderByCalculatedAtDesc();

        BigDecimal totalBase = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        BigDecimal totalAgency = BigDecimal.ZERO;
        BigDecimal totalRecurring = BigDecimal.ZERO;
        long totalLives = 0;

        for (CommissionEntry entry : entries) {
            totalBase = totalBase.add(entry.getBaseAmount());
            totalCommission = totalCommission.add(entry.getCommissionAmount());
            totalLives += entry.getLivesCount();

            if (entry.getCommissionType() == CommissionType.AGENCY) {
                totalAgency = totalAgency.add(entry.getCommissionAmount());
            } else {
                totalRecurring = totalRecurring.add(entry.getCommissionAmount());
            }
        }

        long pendingSales = saleRepository.countByCalculationStatus(SaleCalculationStatus.PENDING)
                + saleRepository.countByCalculationStatus(SaleCalculationStatus.NO_MATCHING_RULE);
        long activeRules = ruleRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getActive()))
                .count();

        return CommissionSummaryDto.builder()
                .totalBasePremium(totalBase)
                .totalCommissionAmount(totalCommission)
                .totalAgencyAmount(totalAgency)
                .totalRecurringAmount(totalRecurring)
                .totalEntries(entries.size())
                .activeLivesCount(totalLives)
                .pendingSalesCount(pendingSales)
                .activeRulesCount(activeRules)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommissionRuleResponseDto> listRules() {
        return ruleRepository.findAllByOrderByOperatorNameAscProductNameAsc().stream()
                .map(this::toRuleDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommissionRuleResponseDto createRule(CommissionRuleRequestDto request) {
        String code = request.getRuleCode().trim().toUpperCase();
        if (ruleRepository.findByRuleCodeIgnoreCase(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma regra cadastrada com o código " + code);
        }

        CommissionRule rule = CommissionRule.builder()
                .ruleCode(code)
                .operatorName(request.getOperatorName().trim())
                .productName(request.getProductName().trim())
                .agencyPercentage(request.getAgencyPercentage())
                .agencyInstallments(request.getAgencyInstallments())
                .recurringPercentage(request.getRecurringPercentage())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .active(true)
                .build();

        CommissionRule saved = ruleRepository.save(rule);
        // Reprocessa vendas sem regra que possam casar com a nova regra
        executeCalculationEngine();
        return toRuleDto(saved);
    }

    @Transactional
    public CommissionRuleResponseDto toggleRuleStatus(UUID id) {
        CommissionRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Regra não encontrada."));
        rule.setActive(!Boolean.TRUE.equals(rule.getActive()));
        CommissionRule saved = ruleRepository.save(rule);
        if (Boolean.TRUE.equals(saved.getActive())) {
            executeCalculationEngine();
        }
        return toRuleDto(saved);
    }

    @Transactional
    public CsvImportBatchDto importSalesCsv(MultipartFile file, String defaultReferenceMonth) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione um arquivo CSV válido para importação.");
        }

        String refMonth = (defaultReferenceMonth != null && !defaultReferenceMonth.isBlank())
                ? defaultReferenceMonth.trim()
                : YearMonth.now().toString();

        int totalRows = 0;
        int validRows = 0;
        int invalidRows = 0;
        List<String> errors = new ArrayList<>();
        List<PolicySale> salesToSave = new ArrayList<>();

        CsvImportBatch batch = CsvImportBatch.builder()
                .filename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "import.csv")
                .referenceMonth(refMonth)
                .totalRows(0)
                .validRows(0)
                .invalidRows(0)
                .status(BatchImportStatus.PROCESSED)
                .build();
        batch = batchRepository.save(batch);

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            int lineNumber = 0;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                String trimmed = line.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }

                // Ignora cabeçalho
                if (lineNumber == 1 && (trimmed.toLowerCase().contains("proposal_number")
                        || trimmed.toLowerCase().contains("proposta"))) {
                    continue;
                }

                totalRows++;
                String delimiter = trimmed.contains(";") ? ";" : ",";
                String[] cols = trimmed.split(delimiter, -1);

                if (cols.length < 8) {
                    invalidRows++;
                    errors.add("Linha " + lineNumber + ": Esperadas pelo menos 8 colunas, encontradas " + cols.length + ".");
                    continue;
                }

                try {
                    String proposalNumber = cols[0].trim();
                    String brokerDoc = cols[1].trim().replaceAll("\\D", "");
                    String operatorName = cols[2].trim();
                    String productName = cols[3].trim();
                    String beneficiaryName = cols[4].trim();
                    int livesCount = Integer.parseInt(cols[5].trim());
                    BigDecimal monthlyPremium = new BigDecimal(cols[6].trim().replace("R$", "").trim());
                    int installmentNumber = Integer.parseInt(cols[7].trim());
                    String rowMonth = (cols.length >= 9 && !cols[8].trim().isEmpty())
                            ? cols[8].trim()
                            : refMonth;

                    Optional<Broker> brokerOpt = brokerRepository.findByDocumentNumber(brokerDoc);
                    if (brokerOpt.isEmpty()) {
                        invalidRows++;
                        errors.add("Linha " + lineNumber + " (" + proposalNumber + "): Corretor com CPF/CNPJ '" + brokerDoc + "' não encontrado.");
                        continue;
                    }

                    if (saleRepository.findByProposalNumberIgnoreCaseAndInstallmentNumberAndReferenceMonth(
                            proposalNumber, installmentNumber, rowMonth).isPresent()) {
                        invalidRows++;
                        errors.add("Linha " + lineNumber + " (" + proposalNumber + "): Parcela " + installmentNumber + " na competência " + rowMonth + " já importada anteriormente.");
                        continue;
                    }

                    PolicySale sale = PolicySale.builder()
                            .batch(batch)
                            .broker(brokerOpt.get())
                            .proposalNumber(proposalNumber)
                            .operatorName(operatorName)
                            .productName(productName)
                            .beneficiaryName(beneficiaryName)
                            .livesCount(livesCount)
                            .monthlyPremium(monthlyPremium)
                            .installmentNumber(installmentNumber)
                            .referenceMonth(rowMonth)
                            .calculationStatus(SaleCalculationStatus.PENDING)
                            .build();

                    salesToSave.add(sale);
                    validRows++;
                } catch (Exception rowEx) {
                    invalidRows++;
                    errors.add("Linha " + lineNumber + ": Erro de formatação numérica (" + rowEx.getMessage() + ").");
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falha ao ler arquivo CSV: " + e.getMessage());
        }

        if (!salesToSave.isEmpty()) {
            saleRepository.saveAll(salesToSave);
        }

        batch.setTotalRows(totalRows);
        batch.setValidRows(validRows);
        batch.setInvalidRows(invalidRows);

        if (validRows > 0 && invalidRows == 0) {
            batch.setStatus(BatchImportStatus.PROCESSED);
            batch.setErrorReport("Todas as " + validRows + " linhas foram validadas e enviadas ao motor.");
        } else if (validRows > 0) {
            batch.setStatus(BatchImportStatus.PARTIAL);
            batch.setErrorReport(String.join("\n", errors));
        } else {
            batch.setStatus(BatchImportStatus.FAILED);
            batch.setErrorReport(errors.isEmpty() ? "Nenhuma linha válida encontrada no arquivo." : String.join("\n", errors));
        }

        CsvImportBatch savedBatch = batchRepository.save(batch);

        // Executa o motor imediatamente para já calcular as vendas recém-importadas
        executeCalculationEngine();

        return toBatchDto(savedBatch);
    }

    @Transactional(readOnly = true)
    public List<CsvImportBatchDto> listBatches() {
        return batchRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toBatchDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommissionEntryDto> listEntries(CommissionType type, String search) {
        List<CommissionEntry> entries = entryRepository.findAllByOrderByCalculatedAtDesc();

        if (type != null) {
            entries = entries.stream()
                    .filter(e -> e.getCommissionType() == type)
                    .collect(Collectors.toList());
        }

        if (search != null && !search.isBlank()) {
            String term = search.trim().toLowerCase();
            entries = entries.stream()
                    .filter(e -> e.getBroker().getName().toLowerCase().contains(term)
                            || e.getSale().getProposalNumber().toLowerCase().contains(term)
                            || e.getSale().getBeneficiaryName().toLowerCase().contains(term)
                            || e.getSale().getOperatorName().toLowerCase().contains(term))
                    .collect(Collectors.toList());
        }

        return entries.stream()
                .map(this::toEntryDto)
                .collect(Collectors.toList());
    }

    public String getCsvTemplateContent() {
        return """
                proposal_number,broker_document,operator_name,product_name,beneficiary_name,lives_count,monthly_premium,installment_number,reference_month
                PROP-2026-9501,12345678000195,Bradesco Saúde,Saúde Top Nacional PME,Inova Tecnologia e Sistemas S.A.,18,21400.00,1,2026-11
                PROP-2026-9502,12345678000195,SulAmérica,Exato Empresarial,Metalúrgica Vale do Sol Ltda,35,41200.00,5,2026-11
                PROP-2026-9503,39485712890,Amil,Amil S450 Coletivo,Laboratório Vida Diagnósticos,9,11600.00,1,2026-11
                PROP-2026-9504,39485712890,Unimed Nacional,Clássico Adesão PF,Fernanda Ribeiro Duarte,4,4200.00,8,2026-11
                """;
    }

    private CommissionRuleResponseDto toRuleDto(CommissionRule rule) {
        return CommissionRuleResponseDto.builder()
                .id(rule.getId())
                .ruleCode(rule.getRuleCode())
                .operatorName(rule.getOperatorName())
                .productName(rule.getProductName())
                .agencyPercentage(rule.getAgencyPercentage())
                .agencyInstallments(rule.getAgencyInstallments())
                .recurringPercentage(rule.getRecurringPercentage())
                .effectiveFrom(rule.getEffectiveFrom())
                .effectiveTo(rule.getEffectiveTo())
                .active(rule.getActive())
                .createdAt(rule.getCreatedAt())
                .build();
    }

    private CsvImportBatchDto toBatchDto(CsvImportBatch batch) {
        return CsvImportBatchDto.builder()
                .id(batch.getId())
                .filename(batch.getFilename())
                .referenceMonth(batch.getReferenceMonth())
                .totalRows(batch.getTotalRows())
                .validRows(batch.getValidRows())
                .invalidRows(batch.getInvalidRows())
                .status(batch.getStatus())
                .errorReport(batch.getErrorReport())
                .createdAt(batch.getCreatedAt())
                .build();
    }

    private CommissionEntryDto toEntryDto(CommissionEntry entry) {
        return CommissionEntryDto.builder()
                .id(entry.getId())
                .brokerId(entry.getBroker().getId())
                .brokerName(entry.getBroker().getName())
                .brokerDocument(entry.getBroker().getDocumentNumber())
                .proposalNumber(entry.getSale().getProposalNumber())
                .beneficiaryName(entry.getSale().getBeneficiaryName())
                .operatorName(entry.getSale().getOperatorName())
                .productName(entry.getSale().getProductName())
                .ruleCode(entry.getRule().getRuleCode())
                .referenceMonth(entry.getReferenceMonth())
                .commissionType(entry.getCommissionType())
                .installmentNumber(entry.getInstallmentNumber())
                .livesCount(entry.getLivesCount())
                .baseAmount(entry.getBaseAmount())
                .appliedPercentage(entry.getAppliedPercentage())
                .commissionAmount(entry.getCommissionAmount())
                .status(entry.getStatus())
                .calculatedAt(entry.getCalculatedAt())
                .build();
    }
}


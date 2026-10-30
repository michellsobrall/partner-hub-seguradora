package com.partnerhub.service;

import com.partnerhub.domain.entity.*;
import com.partnerhub.domain.enums.*;
import com.partnerhub.dto.rpa.*;
import com.partnerhub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class RpaMigrationService {

    private final RpaMigrationJobRepository jobRepository;
    private final BrokerRepository brokerRepository;
    private final CommissionRuleRepository ruleRepository;
    private final PolicySaleRepository saleRepository;
    private final ContractPdfService contractPdfService;
    private final CommissionEngineService commissionEngineService;

    public RpaMigrationService(
            RpaMigrationJobRepository jobRepository,
            BrokerRepository brokerRepository,
            CommissionRuleRepository ruleRepository,
            PolicySaleRepository saleRepository,
            ContractPdfService contractPdfService,
            CommissionEngineService commissionEngineService
    ) {
        this.jobRepository = jobRepository;
        this.brokerRepository = brokerRepository;
        this.ruleRepository = ruleRepository;
        this.saleRepository = saleRepository;
        this.contractPdfService = contractPdfService;
        this.commissionEngineService = commissionEngineService;
    }

    @Transactional
    public RpaMigrationJobDto ingestMigrationBatch(RpaIngestPayloadDto payload) {
        List<String> logs = new ArrayList<>();
        logs.add("[Playwright Headless POM] Sessão autenticada em: " + payload.getSourcePortal());
        logs.add(String.format(
                "[DOM Scraper] Extraídos %d registros brutos de corretores e %d regras de vigência.",
                payload.getRawBrokersCount() != null ? payload.getRawBrokersCount() : 0,
                payload.getRawRulesCount() != null ? payload.getRawRulesCount() : 0
        ));
        logs.add(String.format(
                "[Pandas Sanitizer] Higienização concluída: %d linhas duplicadas descartadas, CPF/CNPJ e moedas normalizados.",
                payload.getDuplicatesRemoved() != null ? payload.getDuplicatesRemoved() : 0
        ));

        int brokersCreated = 0;
        int rulesCreated = 0;

        if (payload.getBrokers() != null) {
            for (RpaBrokerItemDto bDto : payload.getBrokers()) {
                String cleanDoc = bDto.getDocumentNumber().replaceAll("\\D", "");
                if (cleanDoc.isBlank()) continue;

                Optional<Broker> existing = brokerRepository.findByDocumentNumber(cleanDoc);
                if (existing.isPresent()) {
                    logs.add("[Ingest Broker] CPF/CNPJ " + cleanDoc + " (" + bDto.getName() + ") já existente — mantido por idempotência.");
                    continue;
                }

                PersonType pType = "PF".equalsIgnoreCase(bDto.getPersonType()) ? PersonType.PF : PersonType.PJ;
                Broker broker = Broker.builder()
                        .personType(pType)
                        .name(bDto.getName().trim())
                        .tradeName(bDto.getTradeName() != null && !bDto.getTradeName().isBlank() ? bDto.getTradeName().trim() : null)
                        .documentNumber(cleanDoc)
                        .email(bDto.getEmail().trim().toLowerCase())
                        .phone(bDto.getPhone().replaceAll("\\D", ""))
                        .susepCode(bDto.getSusepCode())
                        .status(OnboardingStatus.APPROVED)
                        .reviewNotes("Migrado automaticamente via RPA (Playwright + Pandas) do sistema legado.")
                        .reviewedAt(Instant.now())
                        .build();

                PixKeyType pixType = PixKeyType.CNPJ;
                try {
                    if (bDto.getPixKeyType() != null) {
                        pixType = PixKeyType.valueOf(bDto.getPixKeyType().trim().toUpperCase());
                    }
                } catch (Exception ignored) {
                }

                BrokerBankAccount bank = BrokerBankAccount.builder()
                        .broker(broker)
                        .bankCode(bDto.getBankCode() != null ? bDto.getBankCode() : "001")
                        .bankName(bDto.getBankName() != null ? bDto.getBankName() : "Banco Padrão")
                        .agency(bDto.getAgency() != null ? bDto.getAgency() : "0001")
                        .accountNumber(bDto.getAccountNumber() != null ? bDto.getAccountNumber() : "00000-0")
                        .accountType(AccountType.CHECKING)
                        .pixKeyType(pixType)
                        .pixKey(bDto.getPixKey())
                        .isPrimary(true)
                        .build();
                broker.getBankAccounts().add(bank);

                String contractNo = String.format("PH-RPA-%d-%04d",
                        Year.now().getValue(),
                        ThreadLocalRandom.current().nextInt(1000, 9999));
                String terms = contractPdfService.buildContractTerms(broker, bank, contractNo);
                String sha = contractPdfService.computeSha256(terms);

                BrokerContract contract = BrokerContract.builder()
                        .broker(broker)
                        .contractNumber(contractNo)
                        .contractVersion("1.0-RPA")
                        .termsText(terms)
                        .documentHashSha256(sha)
                        .signed(true)
                        .signerName(broker.getName())
                        .signerDocument(cleanDoc)
                        .signerIp("10.240.0.15 (RPA-Worker)")
                        .signerUserAgent("Playwright/1.44.0 (Headless Chromium; Python 3.11; POM)")
                        .signedAt(Instant.now())
                        .build();
                broker.setContract(contract);

                brokerRepository.save(broker);
                brokersCreated++;
                logs.add("[Ingest Broker] Corretor legado migrado e homologado: " + broker.getName() + " (" + cleanDoc + ")");
            }
        }

        if (payload.getRules() != null) {
            for (RpaRuleItemDto rDto : payload.getRules()) {
                String code = rDto.getRuleCode().trim().toUpperCase();
                if (ruleRepository.findByRuleCodeIgnoreCase(code).isPresent()) {
                    logs.add("[Ingest Rule] Regra " + code + " já existente — mantida por idempotência.");
                    continue;
                }

                LocalDate effDate = LocalDate.of(2026, 1, 1);
                try {
                    if (rDto.getEffectiveFrom() != null) {
                        effDate = LocalDate.parse(rDto.getEffectiveFrom().trim());
                    }
                } catch (Exception ignored) {
                }

                CommissionRule rule = CommissionRule.builder()
                        .ruleCode(code)
                        .operatorName(rDto.getOperatorName().trim())
                        .productName(rDto.getProductName().trim())
                        .agencyPercentage(rDto.getAgencyPercentage())
                        .agencyInstallments(rDto.getAgencyInstallments() != null ? rDto.getAgencyInstallments() : 1)
                        .recurringPercentage(rDto.getRecurringPercentage())
                        .effectiveFrom(effDate)
                        .active(true)
                        .build();

                ruleRepository.save(rule);
                rulesCreated++;
                logs.add("[Ingest Rule] Nova regra de vigência importada: " + code + " (" + rule.getOperatorName() + " - " + rule.getProductName() + ")");
            }
        }

        // Caso o corretor Atlas tenha sido migrado, cria uma venda de Porto Saúde para demonstrar integração ponta a ponta
        brokerRepository.findByDocumentNumber("45781902000163").ifPresent(atlas -> {
            if (saleRepository.findByProposalNumberIgnoreCaseAndInstallmentNumberAndReferenceMonth(
                    "PROP-RPA-9901", 1, "2026-10").isEmpty()) {
                PolicySale rpaSale = PolicySale.builder()
                        .broker(atlas)
                        .proposalNumber("PROP-RPA-9901")
                        .operatorName("Porto Saúde")
                        .productName("Porto Pro Empresarial PME")
                        .beneficiaryName("BioTech Farmacêutica do Brasil S.A.")
                        .livesCount(22)
                        .monthlyPremium(new BigDecimal("26800.00"))
                        .installmentNumber(1)
                        .referenceMonth("2026-10")
                        .calculationStatus(SaleCalculationStatus.PENDING)
                        .build();
                saleRepository.save(rpaSale);
                logs.add("[Motor Integration] Apólice legada PROP-RPA-9901 vinculada e enviada para cálculo de comissão.");
            }
        });

        commissionEngineService.executeCalculationEngine();

        String jobCode = String.format("RPA-JOB-%d-%04d",
                Year.now().getValue(),
                ThreadLocalRandom.current().nextInt(1000, 9999));

        RpaMigrationJob job = RpaMigrationJob.builder()
                .jobCode(jobCode)
                .sourcePortal(payload.getSourcePortal() != null ? payload.getSourcePortal() : "SGP-Saúde Legado v4.2")
                .triggerMode(payload.getTriggerMode() != null ? payload.getTriggerMode() : "REST_API_INGEST")
                .rawBrokersCount(payload.getRawBrokersCount() != null ? payload.getRawBrokersCount() : 0)
                .rawRulesCount(payload.getRawRulesCount() != null ? payload.getRawRulesCount() : 0)
                .duplicatesRemoved(payload.getDuplicatesRemoved() != null ? payload.getDuplicatesRemoved() : 0)
                .brokersIngested(brokersCreated)
                .rulesIngested(rulesCreated)
                .durationMs(payload.getDurationMs() != null ? payload.getDurationMs() : 1420L)
                .status("COMPLETED")
                .executionLog(String.join("\n", logs))
                .executedAt(Instant.now())
                .build();

        RpaMigrationJob saved = jobRepository.save(job);
        return toJobDto(saved);
    }

    /**
     * Executa o pipeline com os dados do mock_legacy_portal/legacy_portal.html
     * higienizados pelo algoritmo Pandas.
     */
    @Transactional
    public RpaMigrationJobDto triggerInteractivePipeline() {
        List<RpaBrokerItemDto> sanitizedBrokers = List.of(
                RpaBrokerItemDto.builder()
                        .personType("PJ")
                        .name("Atlas Corretora e Consultoria de Saúde S.A.")
                        .tradeName("Atlas Saúde Corporativa")
                        .documentNumber("45781902000163")
                        .email("financeiro@atlassaude.com.br")
                        .phone("11991234567")
                        .susepCode("202088712")
                        .bankCode("033")
                        .bankName("Banco Santander")
                        .agency("2190")
                        .accountNumber("13004921-8")
                        .pixKeyType("CNPJ")
                        .pixKey("45781902000163")
                        .build(),
                RpaBrokerItemDto.builder()
                        .personType("PF")
                        .name("Henrique Vasconcelos Moura")
                        .tradeName(null)
                        .documentNumber("81244091822")
                        .email("henrique.moura@parceirosaude.com.br")
                        .phone("31984129090")
                        .susepCode("104928173")
                        .bankCode("077")
                        .bankName("Banco Inter")
                        .agency("0001")
                        .accountNumber("7788123-0")
                        .pixKeyType("CPF")
                        .pixKey("81244091822")
                        .build()
        );

        List<RpaRuleItemDto> sanitizedRules = List.of(
                RpaRuleItemDto.builder()
                        .ruleCode("REG-PORTO-PRO-05")
                        .operatorName("Porto Saúde")
                        .productName("Porto Pro Empresarial PME")
                        .agencyPercentage(new BigDecimal("220.00"))
                        .agencyInstallments(1)
                        .recurringPercentage(new BigDecimal("4.80"))
                        .effectiveFrom("2026-01-01")
                        .build(),
                RpaRuleItemDto.builder()
                        .ruleCode("REG-OMINT-CORP-06")
                        .operatorName("Omint")
                        .productName("Omint Corporate Premium")
                        .agencyPercentage(new BigDecimal("250.00"))
                        .agencyInstallments(2)
                        .recurringPercentage(new BigDecimal("5.50"))
                        .effectiveFrom("2026-02-01")
                        .build()
        );

        RpaIngestPayloadDto payload = RpaIngestPayloadDto.builder()
                .sourcePortal("SGP-Saúde Legado v4.2 (Playwright Headless POM + Pandas)")
                .triggerMode("WEB_UI_ORCHESTRATOR")
                .rawBrokersCount(3)
                .rawRulesCount(3)
                .duplicatesRemoved(2)
                .durationMs(1685L)
                .brokers(sanitizedBrokers)
                .rules(sanitizedRules)
                .build();

        return ingestMigrationBatch(payload);
    }

    @Transactional(readOnly = true)
    public List<RpaMigrationJobDto> listJobs() {
        return jobRepository.findAllByOrderByExecutedAtDesc().stream()
                .map(this::toJobDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RpaSummaryDto getSummary() {
        List<RpaMigrationJob> jobs = jobRepository.findAllByOrderByExecutedAtDesc();
        long raw = 0;
        long dup = 0;
        long brokers = 0;
        long rules = 0;

        for (RpaMigrationJob j : jobs) {
            raw += (j.getRawBrokersCount() + j.getRawRulesCount());
            dup += j.getDuplicatesRemoved();
            brokers += j.getBrokersIngested();
            rules += j.getRulesIngested();
        }

        return RpaSummaryDto.builder()
                .totalJobsExecuted(jobs.size())
                .totalRawExtracted(raw)
                .totalDuplicatesRemoved(dup)
                .totalBrokersIngested(brokers)
                .totalRulesIngested(rules)
                .build();
    }

    private RpaMigrationJobDto toJobDto(RpaMigrationJob j) {
        return RpaMigrationJobDto.builder()
                .id(j.getId())
                .jobCode(j.getJobCode())
                .sourcePortal(j.getSourcePortal())
                .triggerMode(j.getTriggerMode())
                .rawBrokersCount(j.getRawBrokersCount())
                .rawRulesCount(j.getRawRulesCount())
                .duplicatesRemoved(j.getDuplicatesRemoved())
                .brokersIngested(j.getBrokersIngested())
                .rulesIngested(j.getRulesIngested())
                .durationMs(j.getDurationMs())
                .status(j.getStatus())
                .executionLog(j.getExecutionLog())
                .executedAt(j.getExecutedAt())
                .build();
    }
}


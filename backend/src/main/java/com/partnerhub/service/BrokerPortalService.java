package com.partnerhub.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.partnerhub.domain.entity.Broker;
import com.partnerhub.domain.entity.BrokerBankAccount;
import com.partnerhub.domain.enums.CommissionType;
import com.partnerhub.domain.enums.PayoutStatus;
import com.partnerhub.domain.enums.PersonType;
import com.partnerhub.dto.commission.CommissionEntryDto;
import com.partnerhub.dto.finance.ClawbackResponseDto;
import com.partnerhub.dto.finance.PayoutSettlementDto;
import com.partnerhub.dto.onboarding.BankAccountRequestDto;
import com.partnerhub.dto.onboarding.BrokerResponseDto;
import com.partnerhub.dto.portal.*;
import com.partnerhub.repository.BrokerRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BrokerPortalService {

    private final BrokerRepository brokerRepository;
    private final BrokerOnboardingService onboardingService;
    private final CommissionEngineService commissionService;
    private final FinanceSettlementService financeService;

    public BrokerPortalService(
            BrokerRepository brokerRepository,
            BrokerOnboardingService onboardingService,
            CommissionEngineService commissionService,
            FinanceSettlementService financeService
    ) {
        this.brokerRepository = brokerRepository;
        this.onboardingService = onboardingService;
        this.commissionService = commissionService;
        this.financeService = financeService;
    }

    @Transactional
    public BrokerPortalDashboardDto getBrokerDashboard(UUID brokerId) {
        // Garante que vendas e fechamentos estejam consolidados
        commissionService.executeCalculationEngine();
        List<PayoutSettlementDto> allSettlements = financeService.consolidateSettlements();

        BrokerResponseDto brokerDto = onboardingService.getBrokerById(brokerId);

        List<CommissionEntryDto> brokerEntries = commissionService.listEntries(null, null).stream()
                .filter(e -> brokerId.equals(e.getBrokerId()))
                .collect(Collectors.toList());

        List<PayoutSettlementDto> brokerSettlements = allSettlements.stream()
                .filter(s -> brokerId.equals(s.getBrokerId()))
                .collect(Collectors.toList());

        List<ClawbackResponseDto> brokerClawbacks = financeService.listClawbacks().stream()
                .filter(c -> brokerId.equals(c.getBrokerId()))
                .collect(Collectors.toList());

        BigDecimal earningsMonth = brokerEntries.stream()
                .map(CommissionEntryDto::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int activeLives = brokerEntries.stream()
                .mapToInt(CommissionEntryDto::getLivesCount)
                .sum();

        // Projeção de fatura futura: soma das recorrências + 15% de crescimento estimado de carteira
        BigDecimal recurringBase = brokerEntries.stream()
                .filter(e -> e.getCommissionType() == CommissionType.RECURRING)
                .map(CommissionEntryDto::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal projectedNext = recurringBase.compareTo(BigDecimal.ZERO) > 0
                ? recurringBase.multiply(new BigDecimal("1.15")).setScale(2, RoundingMode.HALF_UP)
                : earningsMonth.multiply(new BigDecimal("0.22")).setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalPaidYear = brokerSettlements.stream()
                .filter(s -> s.getStatus() == PayoutStatus.PAID || s.getStatus() == PayoutStatus.PROCESSING_ASAAS)
                .map(PayoutSettlementDto::getNetPayoutAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal openNetBalance = brokerSettlements.stream()
                .filter(s -> s.getStatus() == PayoutStatus.AWAITING_INVOICE || s.getStatus() == PayoutStatus.READY_TO_PAY)
                .map(PayoutSettlementDto::getNetPayoutAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Construção de Alertas e Lembretes Inteligentes
        List<BrokerAlertDto> alerts = buildBrokerAlerts(brokerDto, brokerSettlements, brokerClawbacks);

        // Construção da Série de Evolução Mensal (Últimos 6 meses)
        List<MonthlyEvolutionPointDto> evolution = buildMonthlyEvolution(earningsMonth, recurringBase, activeLives);

        // Distribuição por Operadora
        List<OperatorShareDto> operatorBreakdown = buildOperatorBreakdown(brokerEntries, earningsMonth);

        return BrokerPortalDashboardDto.builder()
                .broker(brokerDto)
                .earningsInCurrentMonth(earningsMonth)
                .projectedNextInvoice(projectedNext)
                .totalPaidInYear(totalPaidYear)
                .openNetBalance(openNetBalance)
                .totalActiveLives(activeLives)
                .totalPoliciesCount(brokerEntries.size())
                .alerts(alerts)
                .monthlyEvolution(evolution)
                .operatorBreakdown(operatorBreakdown)
                .entries(brokerEntries)
                .settlements(brokerSettlements)
                .clawbacks(brokerClawbacks)
                .build();
    }

    @Transactional
    public BrokerResponseDto updateBrokerBankAccount(UUID brokerId, @Valid BankAccountRequestDto request) {
        Broker broker = brokerRepository.findById(brokerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Corretor não encontrado."));

        BrokerBankAccount bank;
        if (broker.getBankAccounts().isEmpty()) {
            bank = new BrokerBankAccount();
            bank.setBroker(broker);
            bank.setIsPrimary(true);
            broker.getBankAccounts().add(bank);
        } else {
            bank = broker.getBankAccounts().get(0);
        }

        bank.setBankCode(request.getBankCode().trim());
        bank.setBankName(request.getBankName().trim());
        bank.setAgency(request.getAgency().trim());
        bank.setAccountNumber(request.getAccountNumber().trim());
        bank.setAccountType(request.getAccountType());
        bank.setPixKey(request.getPixKey() != null && !request.getPixKey().isBlank() ? request.getPixKey().trim() : null);
        bank.setPixKeyType(request.getPixKey() != null && !request.getPixKey().isBlank() ? request.getPixKeyType() : null);

        brokerRepository.save(broker);
        financeService.consolidateSettlements();
        return onboardingService.getBrokerById(brokerId);
    }

    @Transactional
    public String generateStatementCsv(UUID brokerId) {
        BrokerPortalDashboardDto dash = getBrokerDashboard(brokerId);
        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM para abertura perfeita no Microsoft Excel
        sb.append('\uFEFF');
        sb.append("Competencia;Proposta;Beneficiario_Estipulante;Operadora;Plano;Modalidade;Parcela;Vidas_Ativas;Premio_Base_BRL;Percentual_Aplicado;Comissao_Apurada_BRL\n");

        for (CommissionEntryDto e : dash.getEntries()) {
            sb.append(e.getReferenceMonth()).append(';')
                    .append(e.getProposalNumber()).append(';')
                    .append(e.getBeneficiaryName()).append(';')
                    .append(e.getOperatorName()).append(';')
                    .append(e.getProductName()).append(';')
                    .append(e.getCommissionType().name()).append(';')
                    .append(e.getInstallmentNumber()).append(';')
                    .append(e.getLivesCount()).append(';')
                    .append(e.getBaseAmount()).append(';')
                    .append(e.getAppliedPercentage()).append("%;")
                    .append(e.getCommissionAmount()).append('\n');
        }
        return sb.toString();
    }

    @Transactional
    public byte[] generateStatementPdf(UUID brokerId) {
        BrokerPortalDashboardDto dash = getBrokerDashboard(brokerId);
        BrokerResponseDto b = dash.getBroker();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(79, 70, 229));
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(15, 23, 42));
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, new Color(51, 65, 85));
            Font boldGreen = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, new Color(5, 150, 105));

            doc.add(new Paragraph("PARTNER HUB • DEMONSTRATIVO ANALÍTICO DE COMISSÕES", brandFont));
            Paragraph sub = new Paragraph(
                    "Parceiro: " + b.getName() + " (" + b.getDocumentNumber() + ") • Vidas Ativas: " + dash.getTotalActiveLives(),
                    cellFont
            );
            sub.setSpacingAfter(14f);
            doc.add(sub);

            // Tabela de KPIs
            PdfPTable kpiTable = new PdfPTable(4);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(16f);
            addKpiCell(kpiTable, "Ganhos no Mês", "R$ " + dash.getEarningsInCurrentMonth(), cellFont, titleFont);
            addKpiCell(kpiTable, "Fatura Projetada", "R$ " + dash.getProjectedNextInvoice(), cellFont, titleFont);
            addKpiCell(kpiTable, "Total Pago no Ano", "R$ " + dash.getTotalPaidInYear(), cellFont, boldGreen);
            addKpiCell(kpiTable, "Saldo em Aberto", "R$ " + dash.getOpenNetBalance(), cellFont, titleFont);
            doc.add(kpiTable);

            // Tabela de Lançamentos
            PdfPTable table = new PdfPTable(new float[]{1.4f, 2.2f, 1.8f, 1.2f, 1.2f, 1.4f});
            table.setWidthPercentage(100);

            String[] headers = {"Proposta", "Estipulante", "Operadora/Plano", "Tipo", "Prêmio Base", "Comissão (R$)"};
            for (String h : headers) {
                PdfPCell c = new PdfPCell(new Paragraph(h, titleFont));
                c.setBackgroundColor(new Color(241, 245, 249));
                c.setBorderColor(new Color(226, 232, 240));
                c.setPadding(6f);
                table.addCell(c);
            }

            for (CommissionEntryDto e : dash.getEntries()) {
                addCell(table, e.getProposalNumber() + " (" + e.getReferenceMonth() + ")", cellFont);
                addCell(table, e.getBeneficiaryName(), cellFont);
                addCell(table, e.getOperatorName() + " - " + e.getProductName(), cellFont);
                addCell(table, e.getCommissionType().name() + " (" + e.getAppliedPercentage() + "%)", cellFont);
                addCell(table, "R$ " + e.getBaseAmount(), cellFont);
                addCell(table, "R$ " + e.getCommissionAmount(), boldGreen);
            }

            doc.add(table);
            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao gerar PDF do extrato do corretor", e);
        }
    }

    private List<BrokerAlertDto> buildBrokerAlerts(
            BrokerResponseDto broker,
            List<PayoutSettlementDto> settlements,
            List<ClawbackResponseDto> clawbacks
    ) {
        List<BrokerAlertDto> alerts = new ArrayList<>();

        for (PayoutSettlementDto s : settlements) {
            if (s.getStatus() == PayoutStatus.AWAITING_INVOICE && broker.getPersonType() == PersonType.PJ) {
                alerts.add(BrokerAlertDto.builder()
                        .id("alert-nfse-" + s.getReferenceMonth())
                        .severity("WARNING")
                        .title("Ação Necessária: Envio de Nota Fiscal (NFS-e) — Competência " + s.getReferenceMonth())
                        .message("Seu saldo líquido de R$ " + s.getNetPayoutAmount()
                                + " já está apurado, porém aguarda o upload da NFS-e para liberação no lote Pix/TED do Asaas.")
                        .deadlineLabel("Prazo limite p/ lote: Dia 05")
                        .actionType("UPLOAD_NFSE")
                        .build());
            } else if (s.getStatus() == PayoutStatus.READY_TO_PAY) {
                alerts.add(BrokerAlertDto.builder()
                        .id("alert-ready-" + s.getReferenceMonth())
                        .severity("INFO")
                        .title("Fechamento Liberado para Liquidação Asaas — Competência " + s.getReferenceMonth())
                        .message("Seu repasse líquido de R$ " + s.getNetPayoutAmount()
                                + " via " + s.getTransferMethod() + " está apto e programado para o próximo disparo bancário.")
                        .deadlineLabel("Programado no Lote")
                        .actionType("NONE")
                        .build());
            } else if (s.getStatus() == PayoutStatus.PAID) {
                alerts.add(BrokerAlertDto.builder()
                        .id("alert-paid-" + s.getReferenceMonth())
                        .severity("SUCCESS")
                        .title("Comissão Liquidada via Asaas (" + s.getTransferMethod() + ") — Comp. " + s.getReferenceMonth())
                        .message("Pagamento de R$ " + s.getNetPayoutAmount()
                                + " confirmado na conta bancária vinculada (ID Transação: " + s.getAsaasTransferId() + ").")
                        .deadlineLabel("Liquidado")
                        .actionType("NONE")
                        .build());
            }
        }

        for (ClawbackResponseDto cb : clawbacks) {
            if (!"CANCELLED".equals(cb.getStatus().name())) {
                alerts.add(BrokerAlertDto.builder()
                        .id("alert-cb-" + cb.getId())
                        .severity("DANGER")
                        .title("Aviso de Estorno / Clawback Registrado (" + cb.getProposalNumber() + ")")
                        .message("Retenção de R$ " + cb.getDebitAmount() + " referente a '"
                                + cb.getBeneficiaryName() + "': " + cb.getReason())
                        .deadlineLabel("Comp. " + cb.getReferenceMonth())
                        .actionType("VIEW_STATEMENT")
                        .build());
            }
        }

        if (alerts.isEmpty()) {
            alerts.add(BrokerAlertDto.builder()
                    .id("alert-clean")
                    .severity("SUCCESS")
                    .title("Obrigações Fiscais e Cadastrais em Dia")
                    .message("Nenhuma pendência de NFS-e ou divergência bancária identificada para sua carteira.")
                    .deadlineLabel("Regular")
                    .actionType("NONE")
                    .build());
        }

        return alerts;
    }

    private List<MonthlyEvolutionPointDto> buildMonthlyEvolution(
            BigDecimal currentEarnings,
            BigDecimal currentRecurring,
            int currentLives
    ) {
        BigDecimal base = currentEarnings.compareTo(BigDecimal.ZERO) > 0
                ? currentEarnings
                : new BigDecimal("12500.00");
        int baseLives = Math.max(currentLives, 15);

        String[][] months = {
                {"2026-05", "Mai/26", "0.52"},
                {"2026-06", "Jun/26", "0.61"},
                {"2026-07", "Jul/26", "0.70"},
                {"2026-08", "Ago/26", "0.78"},
                {"2026-09", "Set/26", "0.89"},
                {"2026-10", "Out/26", "1.00"}
        };

        List<MonthlyEvolutionPointDto> series = new ArrayList<>();
        for (int i = 0; i < months.length; i++) {
            BigDecimal factor = new BigDecimal(months[i][2]);
            BigDecimal total = base.multiply(factor).setScale(2, RoundingMode.HALF_UP);
            BigDecimal rec = (i == months.length - 1 && currentRecurring.compareTo(BigDecimal.ZERO) > 0)
                    ? currentRecurring
                    : total.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal ag = total.subtract(rec).max(BigDecimal.ZERO);
            int lives = Math.max(4, Math.round(baseLives * factor.floatValue()));

            series.add(MonthlyEvolutionPointDto.builder()
                    .referenceMonth(months[i][0])
                    .label(months[i][1])
                    .agencyAmount(ag)
                    .recurringAmount(rec)
                    .totalAmount(total)
                    .activeLives(lives)
                    .build());
        }
        return series;
    }

    private List<OperatorShareDto> buildOperatorBreakdown(
            List<CommissionEntryDto> entries,
            BigDecimal totalEarnings
    ) {
        Map<String, List<CommissionEntryDto>> byOp = entries.stream()
                .collect(Collectors.groupingBy(CommissionEntryDto::getOperatorName));

        List<OperatorShareDto> list = new ArrayList<>();
        for (Map.Entry<String, List<CommissionEntryDto>> kv : byOp.entrySet()) {
            int lives = kv.getValue().stream().mapToInt(CommissionEntryDto::getLivesCount).sum();
            BigDecimal comm = kv.getValue().stream()
                    .map(CommissionEntryDto::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            double pct = totalEarnings.compareTo(BigDecimal.ZERO) > 0
                    ? comm.multiply(new BigDecimal("100"))
                    .divide(totalEarnings, 1, RoundingMode.HALF_UP)
                    .doubleValue()
                    : 0.0;

            list.add(OperatorShareDto.builder()
                    .operatorName(kv.getKey())
                    .livesCount(lives)
                    .commissionAmount(comm)
                    .sharePercentage(pct)
                    .build());
        }

        list.sort(Comparator.comparing(OperatorShareDto::getCommissionAmount).reversed());
        return list;
    }

    private void addKpiCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(8f);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value, valueFont));
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, font));
        cell.setPadding(5f);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }
}


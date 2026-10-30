package com.partnerhub.service;

import com.partnerhub.domain.entity.*;
import com.partnerhub.domain.enums.*;
import com.partnerhub.dto.finance.*;
import com.partnerhub.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FinanceSettlementService {

    private final PayoutSettlementRepository settlementRepository;
    private final BrokerInvoiceRepository invoiceRepository;
    private final ClawbackEntryRepository clawbackRepository;
    private final CommissionEntryRepository commissionEntryRepository;
    private final BrokerRepository brokerRepository;
    private final ContractPdfService contractPdfService;
    private final AsaasGatewayClient asaasGatewayClient;

    public FinanceSettlementService(
            PayoutSettlementRepository settlementRepository,
            BrokerInvoiceRepository invoiceRepository,
            ClawbackEntryRepository clawbackRepository,
            CommissionEntryRepository commissionEntryRepository,
            BrokerRepository brokerRepository,
            ContractPdfService contractPdfService,
            AsaasGatewayClient asaasGatewayClient
    ) {
        this.settlementRepository = settlementRepository;
        this.invoiceRepository = invoiceRepository;
        this.clawbackRepository = clawbackRepository;
        this.commissionEntryRepository = commissionEntryRepository;
        this.brokerRepository = brokerRepository;
        this.contractPdfService = contractPdfService;
        this.asaasGatewayClient = asaasGatewayClient;
    }

    /**
     * Consolida todas as comissões apuradas por (corretor, competência),
     * abate os estornos/clawbacks ativos e aplica a Trava Fiscal de NFS-e para PJ.
     */
    @Transactional
    public List<PayoutSettlementDto> consolidateSettlements() {
        List<CommissionEntry> allEntries = commissionEntryRepository.findAllByOrderByCalculatedAtDesc();

        // Agrupa por chave "brokerId|referenceMonth"
        Map<String, List<CommissionEntry>> grouped = allEntries.stream()
                .collect(Collectors.groupingBy(e -> e.getBroker().getId() + "|" + e.getReferenceMonth()));

        for (Map.Entry<String, List<CommissionEntry>> group : grouped.entrySet()) {
            List<CommissionEntry> entries = group.getValue();
            if (entries.isEmpty()) continue;

            Broker broker = entries.get(0).getBroker();
            String refMonth = entries.get(0).getReferenceMonth();

            BigDecimal gross = entries.stream()
                    .map(CommissionEntry::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<ClawbackEntry> clawbacks = clawbackRepository.findByBrokerIdAndReferenceMonthAndStatusNot(
                    broker.getId(), refMonth, ClawbackStatus.CANCELLED);

            BigDecimal totalClawback = clawbacks.stream()
                    .map(ClawbackEntry::getDebitAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal net = gross.subtract(totalClawback);
            if (net.compareTo(BigDecimal.ZERO) < 0) {
                net = BigDecimal.ZERO;
            }

            Optional<BrokerInvoice> latestInvoiceOpt = invoiceRepository
                    .findFirstByBrokerIdAndReferenceMonthOrderByUploadedAtDesc(broker.getId(), refMonth);

            BrokerBankAccount bank = broker.getBankAccounts().isEmpty() ? null : broker.getBankAccounts().get(0);
            TransferMethod method = (bank != null && bank.getPixKey() != null && !bank.getPixKey().isBlank())
                    ? TransferMethod.PIX
                    : TransferMethod.TED;

            PayoutSettlement settlement = settlementRepository
                    .findByBrokerIdAndReferenceMonth(broker.getId(), refMonth)
                    .orElseGet(() -> PayoutSettlement.builder()
                            .broker(broker)
                            .referenceMonth(refMonth)
                            .status(PayoutStatus.AWAITING_INVOICE)
                            .build());

            settlement.setGrossCommission(gross);
            settlement.setClawbackDeduction(totalClawback);
            settlement.setNetPayoutAmount(net);
            settlement.setTransferMethod(method);
            settlement.setInvoice(latestInvoiceOpt.orElse(null));

            // Se ainda não foi pago nem enviado ao Asaas, avalia elegibilidade de liberação:
            if (settlement.getStatus() != PayoutStatus.PAID
                    && settlement.getStatus() != PayoutStatus.PROCESSING_ASAAS) {

                if (broker.getPersonType() == PersonType.PJ) {
                    boolean hasApprovedNfse = latestInvoiceOpt.isPresent()
                            && latestInvoiceOpt.get().getStatus() == InvoiceStatus.APPROVED;
                    settlement.setStatus(hasApprovedNfse ? PayoutStatus.READY_TO_PAY : PayoutStatus.AWAITING_INVOICE);
                } else {
                    // Pessoa Física não emite NFS-e PJ (retenção RPA na fonte), liberado para pagamento
                    settlement.setStatus(PayoutStatus.READY_TO_PAY);
                }
            }

            settlementRepository.save(settlement);
        }

        return settlementRepository.findAllByOrderByReferenceMonthDescCreatedAtDesc().stream()
                .map(this::toSettlementDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FinanceSummaryDto getSummary() {
        List<PayoutSettlementDto> settlements = consolidateSettlements();
        List<BrokerInvoice> invoices = invoiceRepository.findAllByOrderByUploadedAtDesc();

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalClawback = BigDecimal.ZERO;
        BigDecimal totalReadyNet = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        long awaitingInvoice = 0;
        long readyToPay = 0;
        long paidCount = 0;

        for (PayoutSettlementDto s : settlements) {
            totalGross = totalGross.add(s.getGrossCommission());
            totalClawback = totalClawback.add(s.getClawbackDeduction());

            if (s.getStatus() == PayoutStatus.AWAITING_INVOICE) {
                awaitingInvoice++;
            } else if (s.getStatus() == PayoutStatus.READY_TO_PAY) {
                readyToPay++;
                totalReadyNet = totalReadyNet.add(s.getNetPayoutAmount());
            } else if (s.getStatus() == PayoutStatus.PAID || s.getStatus() == PayoutStatus.PROCESSING_ASAAS) {
                paidCount++;
                totalPaid = totalPaid.add(s.getNetPayoutAmount());
            }
        }

        long pendingInvoices = invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PENDING_REVIEW)
                .count();

        return FinanceSummaryDto.builder()
                .totalGrossCommission(totalGross)
                .totalClawbackDeductions(totalClawback)
                .totalReadyToPayNet(totalReadyNet)
                .totalPaidViaAsaas(totalPaid)
                .awaitingInvoiceCount(awaitingInvoice)
                .readyToPayCount(readyToPay)
                .paidSettlementsCount(paidCount)
                .pendingInvoicesCount(pendingInvoices)
                .build();
    }

    @Transactional
    public BrokerInvoiceDto uploadInvoice(
            UUID brokerId,
            String referenceMonth,
            String invoiceNumber,
            String verificationCode,
            BigDecimal grossAmount,
            MultipartFile file
    ) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Anexe o arquivo PDF ou XML da NFS-e.");
        }

        Broker broker = brokerRepository.findById(brokerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Corretor não encontrado."));

        try {
            byte[] bytes = file.getBytes();
            String sha256 = contractPdfService.computeSha256(bytes);

            BrokerInvoice invoice = BrokerInvoice.builder()
                    .broker(broker)
                    .referenceMonth(referenceMonth.trim())
                    .invoiceNumber(invoiceNumber.trim())
                    .verificationCode(verificationCode != null ? verificationCode.trim() : null)
                    .grossAmount(grossAmount)
                    .originalFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "nfse.pdf")
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/pdf")
                    .fileSize(file.getSize())
                    .sha256Hash(sha256)
                    .fileContent(bytes)
                    .status(InvoiceStatus.PENDING_REVIEW)
                    .uploadedAt(Instant.now())
                    .build();

            BrokerInvoice saved = invoiceRepository.save(invoice);
            consolidateSettlements();
            return toInvoiceDto(saved);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao processar arquivo da NFS-e.");
        }
    }

    @Transactional
    public BrokerInvoiceDto reviewInvoice(UUID invoiceId, InvoiceReviewRequestDto request) {
        BrokerInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nota Fiscal não encontrada."));

        invoice.setStatus(request.getStatus());
        invoice.setReviewNotes(request.getReviewNotes());
        invoice.setReviewedAt(Instant.now());

        BrokerInvoice saved = invoiceRepository.save(invoice);
        // Atualiza imediatamente a trava fiscal do lote do corretor
        consolidateSettlements();
        return toInvoiceDto(saved);
    }

    @Transactional(readOnly = true)
    public List<BrokerInvoiceDto> listInvoices() {
        return invoiceRepository.findAllByOrderByUploadedAtDesc().stream()
                .map(this::toInvoiceDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BrokerInvoice getInvoiceEntity(UUID id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nota Fiscal não encontrada."));
    }

    @Transactional
    public ClawbackResponseDto createClawback(ClawbackRequestDto request) {
        Broker broker = brokerRepository.findById(request.getBrokerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Corretor não encontrado."));

        ClawbackEntry entry = ClawbackEntry.builder()
                .broker(broker)
                .proposalNumber(request.getProposalNumber().trim().toUpperCase())
                .beneficiaryName(request.getBeneficiaryName().trim())
                .reason(request.getReason().trim())
                .referenceMonth(request.getReferenceMonth().trim())
                .debitAmount(request.getDebitAmount())
                .status(ClawbackStatus.PENDING_DEDUCTION)
                .createdAt(Instant.now())
                .build();

        ClawbackEntry saved = clawbackRepository.save(entry);
        consolidateSettlements();
        return toClawbackDto(saved);
    }

    @Transactional
    public ClawbackResponseDto cancelClawback(UUID id) {
        ClawbackEntry entry = clawbackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estorno não encontrado."));
        entry.setStatus(ClawbackStatus.CANCELLED);
        ClawbackEntry saved = clawbackRepository.save(entry);
        consolidateSettlements();
        return toClawbackDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ClawbackResponseDto> listClawbacks() {
        return clawbackRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toClawbackDto)
                .collect(Collectors.toList());
    }

    /**
     * Dispara o pagamento via Asaas (Pix/TED) para todos os fechamentos com status READY_TO_PAY.
     */
    @Transactional
    public List<PayoutSettlementDto> executeBatchPayout() {
        consolidateSettlements();
        List<PayoutSettlement> readyList = settlementRepository.findByStatusOrderByCreatedAtAsc(PayoutStatus.READY_TO_PAY);

        if (readyList.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nenhum fechamento elegível (READY_TO_PAY). Para corretores PJ, aprove antes a NFS-e da competência."
            );
        }

        List<PayoutSettlementDto> processed = new ArrayList<>();
        for (PayoutSettlement settlement : readyList) {
            if (settlement.getNetPayoutAmount().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            processed.add(initiateSingleAsaasTransfer(settlement));
        }

        return processed;
    }

    @Transactional
    public PayoutSettlementDto executeSinglePayout(UUID settlementId) {
        PayoutSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fechamento não encontrado."));

        if (settlement.getBroker().getPersonType() == PersonType.PJ) {
            if (settlement.getInvoice() == null || settlement.getInvoice().getStatus() != InvoiceStatus.APPROVED) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Trava Fiscal PJ ativa: A liberação do pagamento exige NFS-e enviada e aprovada."
                );
            }
        }

        return initiateSingleAsaasTransfer(settlement);
    }

    private PayoutSettlementDto initiateSingleAsaasTransfer(PayoutSettlement settlement) {
        Broker broker = settlement.getBroker();
        BrokerBankAccount bank = broker.getBankAccounts().isEmpty() ? null : broker.getBankAccounts().get(0);

        AsaasGatewayClient.AsaasTransferResult result = asaasGatewayClient.initiateTransfer(
                broker,
                bank,
                settlement.getNetPayoutAmount(),
                settlement.getReferenceMonth()
        );

        settlement.setAsaasTransferId(result.getTransferId());
        settlement.setAsaasReceiptUrl(result.getReceiptUrl());
        settlement.setTransferMethod(result.getMethod());
        settlement.setStatus(PayoutStatus.PROCESSING_ASAAS);
        settlement.setWebhookEventLog(
                "[" + Instant.now() + "] ASAAS_TRANSFER_CREATED: " + result.getLogSummary()
        );

        PayoutSettlement saved = settlementRepository.save(settlement);
        return toSettlementDto(saved);
    }

    /**
     * Recebe notificações de Webhook do Asaas (TRANSFER_COMPLETED ou TRANSFER_FAILED).
     */
    @Transactional
    public PayoutSettlementDto processAsaasWebhook(AsaasWebhookPayloadDto payload) {
        PayoutSettlement settlement = settlementRepository.findByAsaasTransferId(payload.getAsaasTransferId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transferência Asaas não localizada: " + payload.getAsaasTransferId()
                ));

        String existingLog = settlement.getWebhookEventLog() != null ? settlement.getWebhookEventLog() + "\n" : "";

        if ("TRANSFER_COMPLETED".equalsIgnoreCase(payload.getEvent())) {
            settlement.setStatus(PayoutStatus.PAID);
            settlement.setPaidAt(Instant.now());
            settlement.setWebhookEventLog(
                    existingLog + "[" + Instant.now() + "] WEBHOOK TRANSFER_COMPLETED: Liquidação Pix/TED confirmada pelo banco."
            );

            // Marca os clawbacks da competência como DEDUCTED
            List<ClawbackEntry> clawbacks = clawbackRepository.findByBrokerIdAndReferenceMonthAndStatusNot(
                    settlement.getBroker().getId(),
                    settlement.getReferenceMonth(),
                    ClawbackStatus.CANCELLED
            );
            for (ClawbackEntry cb : clawbacks) {
                cb.setStatus(ClawbackStatus.DEDUCTED);
                clawbackRepository.save(cb);
            }
        } else if ("TRANSFER_FAILED".equalsIgnoreCase(payload.getEvent())) {
            settlement.setStatus(PayoutStatus.FAILED);
            settlement.setWebhookEventLog(
                    existingLog + "[" + Instant.now() + "] WEBHOOK TRANSFER_FAILED: "
                            + (payload.getFailureReason() != null ? payload.getFailureReason() : "Falha bancária informada pelo Asaas.")
            );
        }

        PayoutSettlement saved = settlementRepository.save(settlement);
        return toSettlementDto(saved);
    }

    private PayoutSettlementDto toSettlementDto(PayoutSettlement s) {
        Broker b = s.getBroker();
        BrokerBankAccount bank = b.getBankAccounts().isEmpty() ? null : b.getBankAccounts().get(0);
        String bankSummary = bank != null
                ? bank.getBankCode() + " - " + bank.getBankName() + " (Ag " + bank.getAgency() + " / CC " + bank.getAccountNumber() + ")"
                : "Não informada";
        String pixSummary = (bank != null && bank.getPixKey() != null)
                ? bank.getPixKeyType() + ": " + bank.getPixKey()
                : "Transferência TED";

        BrokerInvoice inv = s.getInvoice();

        return PayoutSettlementDto.builder()
                .id(s.getId())
                .brokerId(b.getId())
                .brokerName(b.getName())
                .brokerDocument(b.getDocumentNumber())
                .personType(b.getPersonType())
                .bankSummary(bankSummary)
                .pixSummary(pixSummary)
                .referenceMonth(s.getReferenceMonth())
                .grossCommission(s.getGrossCommission())
                .clawbackDeduction(s.getClawbackDeduction())
                .netPayoutAmount(s.getNetPayoutAmount())
                .transferMethod(s.getTransferMethod())
                .invoiceId(inv != null ? inv.getId() : null)
                .invoiceNumber(inv != null ? inv.getInvoiceNumber() : null)
                .invoiceStatus(inv != null ? inv.getStatus() : null)
                .asaasTransferId(s.getAsaasTransferId())
                .status(s.getStatus())
                .asaasReceiptUrl(s.getAsaasReceiptUrl())
                .webhookEventLog(s.getWebhookEventLog())
                .paidAt(s.getPaidAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private BrokerInvoiceDto toInvoiceDto(BrokerInvoice i) {
        return BrokerInvoiceDto.builder()
                .id(i.getId())
                .brokerId(i.getBroker().getId())
                .brokerName(i.getBroker().getName())
                .brokerDocument(i.getBroker().getDocumentNumber())
                .referenceMonth(i.getReferenceMonth())
                .invoiceNumber(i.getInvoiceNumber())
                .verificationCode(i.getVerificationCode())
                .grossAmount(i.getGrossAmount())
                .originalFilename(i.getOriginalFilename())
                .contentType(i.getContentType())
                .fileSize(i.getFileSize())
                .sha256Hash(i.getSha256Hash())
                .status(i.getStatus())
                .reviewNotes(i.getReviewNotes())
                .uploadedAt(i.getUploadedAt())
                .reviewedAt(i.getReviewedAt())
                .build();
    }

    private ClawbackResponseDto toClawbackDto(ClawbackEntry c) {
        return ClawbackResponseDto.builder()
                .id(c.getId())
                .brokerId(c.getBroker().getId())
                .brokerName(c.getBroker().getName())
                .brokerDocument(c.getBroker().getDocumentNumber())
                .proposalNumber(c.getProposalNumber())
                .beneficiaryName(c.getBeneficiaryName())
                .reason(c.getReason())
                .referenceMonth(c.getReferenceMonth())
                .debitAmount(c.getDebitAmount())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}


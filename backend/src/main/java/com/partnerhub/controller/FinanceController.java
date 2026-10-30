package com.partnerhub.controller;

import com.partnerhub.domain.entity.BrokerInvoice;
import com.partnerhub.dto.finance.*;
import com.partnerhub.service.FinanceSettlementService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance")
public class FinanceController {

    private final FinanceSettlementService financeService;

    public FinanceController(FinanceSettlementService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/summary")
    public ResponseEntity<FinanceSummaryDto> getSummary() {
        return ResponseEntity.ok(financeService.getSummary());
    }

    @GetMapping("/settlements")
    public ResponseEntity<List<PayoutSettlementDto>> listSettlements() {
        return ResponseEntity.ok(financeService.consolidateSettlements());
    }

    @PostMapping("/settlements/pay-batch")
    public ResponseEntity<List<PayoutSettlementDto>> executeBatchPayout() {
        return ResponseEntity.ok(financeService.executeBatchPayout());
    }

    @PostMapping("/settlements/{id}/pay")
    public ResponseEntity<PayoutSettlementDto> executeSinglePayout(@PathVariable UUID id) {
        return ResponseEntity.ok(financeService.executeSinglePayout(id));
    }

    @PostMapping("/webhooks/asaas")
    public ResponseEntity<PayoutSettlementDto> handleAsaasWebhook(
            @RequestBody AsaasWebhookPayloadDto payload
    ) {
        return ResponseEntity.ok(financeService.processAsaasWebhook(payload));
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<BrokerInvoiceDto>> listInvoices() {
        return ResponseEntity.ok(financeService.listInvoices());
    }

    @PostMapping(value = "/invoices", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BrokerInvoiceDto> uploadInvoice(
            @RequestParam("brokerId") UUID brokerId,
            @RequestParam("referenceMonth") String referenceMonth,
            @RequestParam("invoiceNumber") String invoiceNumber,
            @RequestParam(value = "verificationCode", required = false) String verificationCode,
            @RequestParam("grossAmount") BigDecimal grossAmount,
            @RequestParam("file") MultipartFile file
    ) {
        BrokerInvoiceDto created = financeService.uploadInvoice(
                brokerId, referenceMonth, invoiceNumber, verificationCode, grossAmount, file
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/invoices/{id}/status")
    public ResponseEntity<BrokerInvoiceDto> reviewInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody InvoiceReviewRequestDto request
    ) {
        return ResponseEntity.ok(financeService.reviewInvoice(id, request));
    }

    @GetMapping("/invoices/{id}/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable UUID id) {
        BrokerInvoice inv = financeService.getInvoiceEntity(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(inv.getContentType()));
        headers.setContentDisposition(ContentDisposition.inline()
                .filename(inv.getOriginalFilename(), StandardCharsets.UTF_8)
                .build());
        return new ResponseEntity<>(inv.getFileContent(), headers, HttpStatus.OK);
    }

    @GetMapping("/clawbacks")
    public ResponseEntity<List<ClawbackResponseDto>> listClawbacks() {
        return ResponseEntity.ok(financeService.listClawbacks());
    }

    @PostMapping("/clawbacks")
    public ResponseEntity<ClawbackResponseDto> createClawback(
            @Valid @RequestBody ClawbackRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(financeService.createClawback(request));
    }

    @PatchMapping("/clawbacks/{id}/cancel")
    public ResponseEntity<ClawbackResponseDto> cancelClawback(@PathVariable UUID id) {
        return ResponseEntity.ok(financeService.cancelClawback(id));
    }
}


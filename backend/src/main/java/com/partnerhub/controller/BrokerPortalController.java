package com.partnerhub.controller;

import com.partnerhub.dto.onboarding.BankAccountRequestDto;
import com.partnerhub.dto.onboarding.BrokerResponseDto;
import com.partnerhub.dto.portal.BrokerPortalDashboardDto;
import com.partnerhub.service.BrokerPortalService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portal/brokers")
public class BrokerPortalController {

    private final BrokerPortalService portalService;

    public BrokerPortalController(BrokerPortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/{brokerId}/dashboard")
    public ResponseEntity<BrokerPortalDashboardDto> getDashboard(@PathVariable UUID brokerId) {
        return ResponseEntity.ok(portalService.getBrokerDashboard(brokerId));
    }

    @PutMapping("/{brokerId}/bank-account")
    public ResponseEntity<BrokerResponseDto> updateBankAccount(
            @PathVariable UUID brokerId,
            @Valid @RequestBody BankAccountRequestDto request
    ) {
        return ResponseEntity.ok(portalService.updateBrokerBankAccount(brokerId, request));
    }

    @GetMapping(value = "/{brokerId}/statement/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadStatementPdf(@PathVariable UUID brokerId) {
        byte[] pdfBytes = portalService.generateStatementPdf(brokerId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline()
                .filename("Demonstrativo_Comissoes_PartnerHub_" + brokerId + ".pdf", StandardCharsets.UTF_8)
                .build());
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping(value = "/{brokerId}/statement/csv", produces = "text/csv")
    public ResponseEntity<byte[]> downloadStatementCsv(@PathVariable UUID brokerId) {
        byte[] csvBytes = portalService.generateStatementCsv(brokerId).getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("Extrato_Comissoes_PartnerHub_" + brokerId + ".csv", StandardCharsets.UTF_8)
                .build());
        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }
}


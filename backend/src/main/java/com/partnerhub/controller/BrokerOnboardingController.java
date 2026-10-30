package com.partnerhub.controller;

import com.partnerhub.domain.entity.BrokerDocument;
import com.partnerhub.domain.enums.DocumentType;
import com.partnerhub.domain.enums.OnboardingStatus;
import com.partnerhub.dto.onboarding.*;
import com.partnerhub.service.BrokerOnboardingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/brokers")
public class BrokerOnboardingController {

    private final BrokerOnboardingService onboardingService;

    public BrokerOnboardingController(BrokerOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping
    public ResponseEntity<List<BrokerResponseDto>> listBrokers(
            @RequestParam(required = false) OnboardingStatus status,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(onboardingService.listBrokers(status, search));
    }

    @GetMapping("/stats")
    public ResponseEntity<BrokerStatsDto> getStats() {
        return ResponseEntity.ok(onboardingService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BrokerResponseDto> getBroker(@PathVariable UUID id) {
        return ResponseEntity.ok(onboardingService.getBrokerById(id));
    }

    @PostMapping("/onboarding")
    public ResponseEntity<BrokerResponseDto> createOnboarding(
            @Valid @RequestBody BrokerOnboardingRequestDto request
    ) {
        BrokerResponseDto created = onboardingService.createOnboarding(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BrokerDocumentDto> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam("file") MultipartFile file
    ) {
        BrokerDocumentDto uploaded = onboardingService.uploadDocument(id, documentType, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(uploaded);
    }

    @GetMapping("/{id}/documents/{documentId}/download")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable UUID id,
            @PathVariable UUID documentId
    ) {
        BrokerDocument doc = onboardingService.getDocumentEntity(id, documentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(doc.getContentType()));
        headers.setContentDisposition(ContentDisposition.inline()
                .filename(doc.getOriginalFilename(), StandardCharsets.UTF_8)
                .build());

        return new ResponseEntity<>(doc.getFileContent(), headers, HttpStatus.OK);
    }

    @GetMapping(value = "/{id}/contract/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadContractPdf(@PathVariable UUID id) {
        byte[] pdfBytes = onboardingService.generateContractPdfBytes(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline()
                .filename("Contrato_Parceria_PartnerHub_" + id + ".pdf", StandardCharsets.UTF_8)
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/{id}/contract/sign")
    public ResponseEntity<BrokerResponseDto> signContract(
            @PathVariable UUID id,
            @Valid @RequestBody ContractSignRequestDto request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = extractClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");
        if (userAgent == null || userAgent.isBlank()) {
            userAgent = "PartnerHub-Web-Client/1.0";
        }

        BrokerResponseDto updated = onboardingService.signContract(id, request, clientIp, userAgent);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BrokerResponseDto> updateWorkflowStatus(
            @PathVariable UUID id,
            @Valid @RequestBody StatusUpdateRequestDto request
    ) {
        BrokerResponseDto updated = onboardingService.updateWorkflowStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}


package com.partnerhub.controller;

import com.partnerhub.domain.enums.CommissionType;
import com.partnerhub.dto.commission.*;
import com.partnerhub.service.CommissionEngineService;
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
@RequestMapping("/api/v1/commissions")
public class CommissionController {

    private final CommissionEngineService commissionService;

    public CommissionController(CommissionEngineService commissionService) {
        this.commissionService = commissionService;
    }

    @GetMapping("/summary")
    public ResponseEntity<CommissionSummaryDto> getSummary() {
        return ResponseEntity.ok(commissionService.getSummary());
    }

    @GetMapping("/rules")
    public ResponseEntity<List<CommissionRuleResponseDto>> listRules() {
        return ResponseEntity.ok(commissionService.listRules());
    }

    @PostMapping("/rules")
    public ResponseEntity<CommissionRuleResponseDto> createRule(
            @Valid @RequestBody CommissionRuleRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commissionService.createRule(request));
    }

    @PatchMapping("/rules/{id}/toggle")
    public ResponseEntity<CommissionRuleResponseDto> toggleRule(@PathVariable UUID id) {
        return ResponseEntity.ok(commissionService.toggleRuleStatus(id));
    }

    @PostMapping(value = "/imports/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CsvImportBatchDto> importCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "referenceMonth", required = false) String referenceMonth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commissionService.importSalesCsv(file, referenceMonth));
    }

    @GetMapping("/imports")
    public ResponseEntity<List<CsvImportBatchDto>> listImportBatches() {
        return ResponseEntity.ok(commissionService.listBatches());
    }

    @GetMapping(value = "/imports/template", produces = "text/csv")
    public ResponseEntity<byte[]> downloadCsvTemplate() {
        byte[] bytes = commissionService.getCsvTemplateContent().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("modelo_importacao_vendas_partnerhub.csv", StandardCharsets.UTF_8)
                .build());
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    @PostMapping("/engine/run")
    public ResponseEntity<EngineExecutionResultDto> runEngineNow() {
        return ResponseEntity.ok(commissionService.executeCalculationEngine());
    }

    @GetMapping("/entries")
    public ResponseEntity<List<CommissionEntryDto>> listEntries(
            @RequestParam(required = false) CommissionType type,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(commissionService.listEntries(type, search));
    }
}


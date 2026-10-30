package com.partnerhub.controller;

import com.partnerhub.dto.rpa.RpaIngestPayloadDto;
import com.partnerhub.dto.rpa.RpaMigrationJobDto;
import com.partnerhub.dto.rpa.RpaSummaryDto;
import com.partnerhub.service.RpaMigrationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rpa")
public class RpaMigrationController {

    private final RpaMigrationService rpaService;

    public RpaMigrationController(RpaMigrationService rpaService) {
        this.rpaService = rpaService;
    }

    @GetMapping("/summary")
    public ResponseEntity<RpaSummaryDto> getSummary() {
        return ResponseEntity.ok(rpaService.getSummary());
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<RpaMigrationJobDto>> listJobs() {
        return ResponseEntity.ok(rpaService.listJobs());
    }

    @PostMapping("/ingest")
    public ResponseEntity<RpaMigrationJobDto> ingestFromPythonBot(
            @RequestBody RpaIngestPayloadDto payload
    ) {
        RpaMigrationJobDto job = rpaService.ingestMigrationBatch(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(job);
    }

    @PostMapping("/trigger-pipeline")
    public ResponseEntity<RpaMigrationJobDto> triggerPipelineFromUi() {
        RpaMigrationJobDto job = rpaService.triggerInteractivePipeline();
        return ResponseEntity.status(HttpStatus.CREATED).body(job);
    }
}


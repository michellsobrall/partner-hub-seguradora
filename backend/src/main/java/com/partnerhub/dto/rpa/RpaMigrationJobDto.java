package com.partnerhub.dto.rpa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RpaMigrationJobDto {
    private UUID id;
    private String jobCode;
    private String sourcePortal;
    private String triggerMode;
    private Integer rawBrokersCount;
    private Integer rawRulesCount;
    private Integer duplicatesRemoved;
    private Integer brokersIngested;
    private Integer rulesIngested;
    private Long durationMs;
    private String status;
    private String executionLog;
    private Instant executedAt;
}


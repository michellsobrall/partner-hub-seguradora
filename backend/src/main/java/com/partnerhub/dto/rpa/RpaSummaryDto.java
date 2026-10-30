package com.partnerhub.dto.rpa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RpaSummaryDto {
    private long totalJobsExecuted;
    private long totalRawExtracted;
    private long totalDuplicatesRemoved;
    private long totalBrokersIngested;
    private long totalRulesIngested;
}


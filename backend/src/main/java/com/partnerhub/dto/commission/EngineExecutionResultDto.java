package com.partnerhub.dto.commission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngineExecutionResultDto {
    private int processedSales;
    private int calculatedEntries;
    private int unmatchedSales;
    private BigDecimal generatedAmount;
    private Instant executedAt;
}


package com.partnerhub.dto.commission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionSummaryDto {
    private BigDecimal totalBasePremium;
    private BigDecimal totalCommissionAmount;
    private BigDecimal totalAgencyAmount;
    private BigDecimal totalRecurringAmount;
    private long totalEntries;
    private long activeLivesCount;
    private long pendingSalesCount;
    private long activeRulesCount;
}


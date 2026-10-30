package com.partnerhub.dto.commission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionRuleResponseDto {
    private UUID id;
    private String ruleCode;
    private String operatorName;
    private String productName;
    private BigDecimal agencyPercentage;
    private Integer agencyInstallments;
    private BigDecimal recurringPercentage;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean active;
    private Instant createdAt;
}


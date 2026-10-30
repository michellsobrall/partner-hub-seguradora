package com.partnerhub.dto.rpa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RpaRuleItemDto {
    private String ruleCode;
    private String operatorName;
    private String productName;
    private BigDecimal agencyPercentage;
    private Integer agencyInstallments;
    private BigDecimal recurringPercentage;
    private String effectiveFrom;
}


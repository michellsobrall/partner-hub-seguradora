package com.partnerhub.dto.portal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyEvolutionPointDto {
    private String referenceMonth;
    private String label;
    private BigDecimal agencyAmount;
    private BigDecimal recurringAmount;
    private BigDecimal totalAmount;
    private int activeLives;
}


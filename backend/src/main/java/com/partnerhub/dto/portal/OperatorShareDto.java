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
public class OperatorShareDto {
    private String operatorName;
    private int livesCount;
    private BigDecimal commissionAmount;
    private double sharePercentage;
}


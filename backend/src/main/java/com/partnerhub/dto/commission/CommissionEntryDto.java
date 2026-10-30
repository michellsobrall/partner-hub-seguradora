package com.partnerhub.dto.commission;

import com.partnerhub.domain.enums.CommissionEntryStatus;
import com.partnerhub.domain.enums.CommissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionEntryDto {
    private UUID id;
    private UUID brokerId;
    private String brokerName;
    private String brokerDocument;
    private String proposalNumber;
    private String beneficiaryName;
    private String operatorName;
    private String productName;
    private String ruleCode;
    private String referenceMonth;
    private CommissionType commissionType;
    private Integer installmentNumber;
    private Integer livesCount;
    private BigDecimal baseAmount;
    private BigDecimal appliedPercentage;
    private BigDecimal commissionAmount;
    private CommissionEntryStatus status;
    private Instant calculatedAt;
}


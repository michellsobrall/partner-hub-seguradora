package com.partnerhub.dto.finance;

import com.partnerhub.domain.enums.ClawbackStatus;
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
public class ClawbackResponseDto {
    private UUID id;
    private UUID brokerId;
    private String brokerName;
    private String brokerDocument;
    private String proposalNumber;
    private String beneficiaryName;
    private String reason;
    private String referenceMonth;
    private BigDecimal debitAmount;
    private ClawbackStatus status;
    private Instant createdAt;
}


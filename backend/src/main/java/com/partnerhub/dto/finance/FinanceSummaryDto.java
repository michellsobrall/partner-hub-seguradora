package com.partnerhub.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceSummaryDto {
    private BigDecimal totalGrossCommission;
    private BigDecimal totalClawbackDeductions;
    private BigDecimal totalReadyToPayNet;
    private BigDecimal totalPaidViaAsaas;
    private long awaitingInvoiceCount;
    private long readyToPayCount;
    private long paidSettlementsCount;
    private long pendingInvoicesCount;
}


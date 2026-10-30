package com.partnerhub.dto.finance;

import com.partnerhub.domain.enums.InvoiceStatus;
import com.partnerhub.domain.enums.PayoutStatus;
import com.partnerhub.domain.enums.PersonType;
import com.partnerhub.domain.enums.TransferMethod;
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
public class PayoutSettlementDto {
    private UUID id;
    private UUID brokerId;
    private String brokerName;
    private String brokerDocument;
    private PersonType personType;
    private String bankSummary;
    private String pixSummary;
    private String referenceMonth;
    private BigDecimal grossCommission;
    private BigDecimal clawbackDeduction;
    private BigDecimal netPayoutAmount;
    private TransferMethod transferMethod;
    private UUID invoiceId;
    private String invoiceNumber;
    private InvoiceStatus invoiceStatus;
    private String asaasTransferId;
    private PayoutStatus status;
    private String asaasReceiptUrl;
    private String webhookEventLog;
    private Instant paidAt;
    private Instant updatedAt;
}


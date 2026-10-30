package com.partnerhub.dto.finance;

import com.partnerhub.domain.enums.InvoiceStatus;
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
public class BrokerInvoiceDto {
    private UUID id;
    private UUID brokerId;
    private String brokerName;
    private String brokerDocument;
    private String referenceMonth;
    private String invoiceNumber;
    private String verificationCode;
    private BigDecimal grossAmount;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String sha256Hash;
    private InvoiceStatus status;
    private String reviewNotes;
    private Instant uploadedAt;
    private Instant reviewedAt;
}


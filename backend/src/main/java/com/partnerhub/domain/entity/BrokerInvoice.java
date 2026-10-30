package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "broker_invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrokerInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false)
    private Broker broker;

    @Column(name = "reference_month", length = 7, nullable = false)
    private String referenceMonth;

    @Column(name = "invoice_number", length = 60, nullable = false)
    private String invoiceNumber;

    @Column(name = "verification_code", length = 60)
    private String verificationCode;

    @Column(name = "gross_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal grossAmount;

    @Column(name = "original_filename", length = 255, nullable = false)
    private String originalFilename;

    @Column(name = "content_type", length = 100, nullable = false)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "sha256_hash", length = 64, nullable = false)
    private String sha256Hash;

    @Column(name = "file_content", nullable = false, columnDefinition = "bytea")
    private byte[] fileContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private InvoiceStatus status;

    @Column(name = "review_notes", length = 255)
    private String reviewNotes;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @PrePersist
    protected void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = InvoiceStatus.PENDING_REVIEW;
        }
    }
}


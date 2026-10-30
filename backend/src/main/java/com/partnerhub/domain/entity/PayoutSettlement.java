package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.PayoutStatus;
import com.partnerhub.domain.enums.TransferMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payout_settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false)
    private Broker broker;

    @Column(name = "reference_month", length = 7, nullable = false)
    private String referenceMonth;

    @Column(name = "gross_commission", precision = 14, scale = 2, nullable = false)
    private BigDecimal grossCommission;

    @Column(name = "clawback_deduction", precision = 14, scale = 2, nullable = false)
    private BigDecimal clawbackDeduction;

    @Column(name = "net_payout_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal netPayoutAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "transfer_method", length = 20, nullable = false)
    private TransferMethod transferMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private BrokerInvoice invoice;

    @Column(name = "asaas_transfer_id", length = 100, unique = true)
    private String asaasTransferId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private PayoutStatus status;

    @Column(name = "asaas_receipt_url", length = 255)
    private String asaasReceiptUrl;

    @Column(name = "webhook_event_log", columnDefinition = "TEXT")
    private String webhookEventLog;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.transferMethod == null) {
            this.transferMethod = TransferMethod.PIX;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}


package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.CommissionEntryStatus;
import com.partnerhub.domain.enums.CommissionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commission_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false)
    private Broker broker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private PolicySale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private CommissionRule rule;

    @Column(name = "reference_month", length = 7, nullable = false)
    private String referenceMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "commission_type", length = 20, nullable = false)
    private CommissionType commissionType;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "lives_count", nullable = false)
    private Integer livesCount;

    @Column(name = "base_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal baseAmount;

    @Column(name = "applied_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal appliedPercentage;

    @Column(name = "commission_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal commissionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private CommissionEntryStatus status;

    @Column(name = "calculated_at")
    private Instant calculatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.calculatedAt == null) {
            this.calculatedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = CommissionEntryStatus.CALCULATED;
        }
    }
}


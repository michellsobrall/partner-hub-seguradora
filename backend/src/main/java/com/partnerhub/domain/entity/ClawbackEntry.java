package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.ClawbackStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clawback_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClawbackEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false)
    private Broker broker;

    @Column(name = "proposal_number", length = 60, nullable = false)
    private String proposalNumber;

    @Column(name = "beneficiary_name", length = 255, nullable = false)
    private String beneficiaryName;

    @Column(name = "reason", length = 255, nullable = false)
    private String reason;

    @Column(name = "reference_month", length = 7, nullable = false)
    private String referenceMonth;

    @Column(name = "debit_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal debitAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ClawbackStatus status;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = ClawbackStatus.PENDING_DEDUCTION;
        }
    }
}


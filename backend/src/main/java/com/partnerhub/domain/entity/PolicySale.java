package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.SaleCalculationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "policy_sales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicySale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private CsvImportBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false)
    private Broker broker;

    @Column(name = "proposal_number", length = 60, nullable = false)
    private String proposalNumber;

    @Column(name = "operator_name", length = 120, nullable = false)
    private String operatorName;

    @Column(name = "product_name", length = 150, nullable = false)
    private String productName;

    @Column(name = "beneficiary_name", length = 255, nullable = false)
    private String beneficiaryName;

    @Column(name = "lives_count", nullable = false)
    private Integer livesCount;

    @Column(name = "monthly_premium", precision = 14, scale = 2, nullable = false)
    private BigDecimal monthlyPremium;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "reference_month", length = 7, nullable = false)
    private String referenceMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_status", length = 30, nullable = false)
    private SaleCalculationStatus calculationStatus;

    @Column(name = "calculation_notes", length = 255)
    private String calculationNotes;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.calculationStatus == null) {
            this.calculationStatus = SaleCalculationStatus.PENDING;
        }
    }
}


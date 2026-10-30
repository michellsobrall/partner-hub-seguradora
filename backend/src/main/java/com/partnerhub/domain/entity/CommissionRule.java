package com.partnerhub.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "commission_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rule_code", length = 40, nullable = false, unique = true)
    private String ruleCode;

    @Column(name = "operator_name", length = 120, nullable = false)
    private String operatorName;

    @Column(name = "product_name", length = 150, nullable = false)
    private String productName;

    @Column(name = "agency_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal agencyPercentage;

    @Column(name = "agency_installments", nullable = false)
    private Integer agencyInstallments;

    @Column(name = "recurring_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal recurringPercentage;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "active", nullable = false)
    private Boolean active;

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
        if (this.active == null) {
            this.active = Boolean.TRUE;
        }
        if (this.agencyInstallments == null) {
            this.agencyInstallments = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}


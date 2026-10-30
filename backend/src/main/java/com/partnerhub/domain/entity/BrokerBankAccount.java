package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.AccountType;
import com.partnerhub.domain.enums.PixKeyType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "broker_bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrokerBankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false)
    private Broker broker;

    @Column(name = "bank_code", length = 10, nullable = false)
    private String bankCode;

    @Column(name = "bank_name", length = 100, nullable = false)
    private String bankName;

    @Column(name = "agency", length = 20, nullable = false)
    private String agency;

    @Column(name = "account_number", length = 30, nullable = false)
    private String accountNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", length = 20, nullable = false)
    private AccountType accountType;

    @Column(name = "pix_key", length = 100)
    private String pixKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "pix_key_type", length = 20)
    private PixKeyType pixKeyType;

    @Column(name = "is_primary")
    private Boolean isPrimary;

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
        if (this.isPrimary == null) {
            this.isPrimary = Boolean.TRUE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}


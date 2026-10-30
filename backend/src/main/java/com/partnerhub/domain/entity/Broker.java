package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.OnboardingStatus;
import com.partnerhub.domain.enums.PersonType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "brokers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Broker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "person_type", length = 10, nullable = false)
    private PersonType personType;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "trade_name", length = 255)
    private String tradeName;

    @Column(name = "document_number", length = 20, nullable = false, unique = true)
    private String documentNumber;

    @Column(name = "email", length = 150, nullable = false, unique = true)
    private String email;

    @Column(name = "phone", length = 30, nullable = false)
    private String phone;

    @Column(name = "susep_code", length = 50)
    private String susepCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private OnboardingStatus status;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "broker", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BrokerBankAccount> bankAccounts = new ArrayList<>();

    @OneToMany(mappedBy = "broker", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BrokerDocument> documents = new ArrayList<>();

    @OneToOne(mappedBy = "broker", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private BrokerContract contract;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.status == null) {
            this.status = OnboardingStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}


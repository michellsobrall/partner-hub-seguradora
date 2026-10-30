package com.partnerhub.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "broker_contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrokerContract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id", nullable = false, unique = true)
    private Broker broker;

    @Column(name = "contract_number", length = 40, nullable = false, unique = true)
    private String contractNumber;

    @Column(name = "contract_version", length = 20, nullable = false)
    private String contractVersion;

    @Column(name = "terms_text", nullable = false, columnDefinition = "TEXT")
    private String termsText;

    @Column(name = "document_hash_sha256", length = 64, nullable = false)
    private String documentHashSha256;

    @Column(name = "signed", nullable = false)
    private Boolean signed;

    @Column(name = "signer_name", length = 255)
    private String signerName;

    @Column(name = "signer_document", length = 20)
    private String signerDocument;

    @Column(name = "signer_ip", length = 64)
    private String signerIp;

    @Column(name = "signer_user_agent", columnDefinition = "TEXT")
    private String signerUserAgent;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.signed == null) {
            this.signed = Boolean.FALSE;
        }
        if (this.contractVersion == null) {
            this.contractVersion = "1.0";
        }
    }
}


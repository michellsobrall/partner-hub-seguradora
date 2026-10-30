package com.partnerhub.dto.onboarding;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerContractDto {
    private UUID id;
    private String contractNumber;
    private String contractVersion;
    private String termsText;
    private String documentHashSha256;
    private Boolean signed;
    private String signerName;
    private String signerDocument;
    private String signerIp;
    private String signerUserAgent;
    private Instant signedAt;
    private Instant createdAt;
}


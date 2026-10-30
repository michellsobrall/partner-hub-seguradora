package com.partnerhub.dto.onboarding;

import com.partnerhub.domain.enums.DocumentType;
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
public class BrokerDocumentDto {
    private UUID id;
    private DocumentType documentType;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String sha256Hash;
    private Instant uploadedAt;
}


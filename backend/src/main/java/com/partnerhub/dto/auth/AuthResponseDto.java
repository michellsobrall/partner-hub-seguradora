package com.partnerhub.dto.auth;

import com.partnerhub.domain.enums.UserRole;
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
public class AuthResponseDto {
    private String accessToken;
    private String tokenType;
    private long expiresInMs;
    private UUID userId;
    private String email;
    private String fullName;
    private UserRole role;
    private UUID brokerId;
    private String brokerName;
    private String brokerDocument;
    private Instant authenticatedAt;
}


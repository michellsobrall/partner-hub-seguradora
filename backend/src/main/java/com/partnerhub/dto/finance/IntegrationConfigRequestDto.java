package com.partnerhub.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConfigRequestDto {
    private String asaasApiUrl;
    private String asaasApiKey;
    private String sendgridApiKey;
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private String emailFromAddress;
    private Integer nfseDeadlineDay;
}


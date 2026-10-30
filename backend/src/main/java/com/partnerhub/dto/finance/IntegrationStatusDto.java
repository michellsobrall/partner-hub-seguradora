package com.partnerhub.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationStatusDto {
    private boolean asaasLiveKeyConfigured;
    private String asaasMode;
    private String asaasApiUrl;
    private boolean emailLiveConfigured;
    private String emailProvider;
    private String emailFromAddress;
    private int nfseDeadlineDay;
    private long totalEmailsDispatched;
}


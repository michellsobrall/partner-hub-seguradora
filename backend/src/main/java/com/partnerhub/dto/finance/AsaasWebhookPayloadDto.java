package com.partnerhub.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsaasWebhookPayloadDto {
    private String event; // Ex: TRANSFER_COMPLETED ou TRANSFER_FAILED
    private String asaasTransferId;
    private String failureReason;
}


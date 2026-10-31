package com.partnerhub.dto.finance;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AsaasWebhookPayloadDto {
    private String event; // Ex: TRANSFER_COMPLETED, TRANSFER_DONE, TRANSFER_FAILED
    private String asaasTransferId;
    private String failureReason;
    private Map<String, Object> transfer; // Suporte nativo ao payload oficial Asaas v3: { "transfer": { "id": "..." } }

    public String resolveTransferId() {
        if (asaasTransferId != null && !asaasTransferId.isBlank()) {
            return asaasTransferId;
        }
        if (transfer != null && transfer.get("id") != null) {
            return String.valueOf(transfer.get("id"));
        }
        return null;
    }

    public String resolveFailureReason() {
        if (failureReason != null && !failureReason.isBlank()) {
            return failureReason;
        }
        if (transfer != null && transfer.get("failReason") != null) {
            return String.valueOf(transfer.get("failReason"));
        }
        return null;
    }
}


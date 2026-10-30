package com.partnerhub.dto.finance;

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
public class EmailNotificationDto {
    private UUID id;
    private UUID brokerId;
    private String recipientEmail;
    private String recipientName;
    private String templateCode;
    private String subject;
    private String bodyPreview;
    private String provider;
    private String deliveryStatus;
    private String externalMessageId;
    private Instant sentAt;
}


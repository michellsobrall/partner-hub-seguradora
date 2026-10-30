package com.partnerhub.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_notification_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "broker_id")
    private UUID brokerId;

    @Column(name = "recipient_email", nullable = false, length = 160)
    private String recipientEmail;

    @Column(name = "recipient_name", nullable = false, length = 180)
    private String recipientName;

    @Column(name = "template_code", nullable = false, length = 60)
    private String templateCode;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "body_preview", nullable = false, columnDefinition = "TEXT")
    private String bodyPreview;

    @Column(name = "provider", nullable = false, length = 40)
    private String provider;

    @Column(name = "delivery_status", nullable = false, length = 40)
    private String deliveryStatus;

    @Column(name = "external_message_id", length = 120)
    private String externalMessageId;

    @Column(name = "sent_at")
    private Instant sentAt;

    @PrePersist
    public void prePersist() {
        if (this.sentAt == null) {
            this.sentAt = Instant.now();
        }
    }
}


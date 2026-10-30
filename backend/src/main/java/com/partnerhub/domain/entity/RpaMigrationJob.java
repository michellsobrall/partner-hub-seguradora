package com.partnerhub.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rpa_migration_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RpaMigrationJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "job_code", length = 40, nullable = false, unique = true)
    private String jobCode;

    @Column(name = "source_portal", length = 150, nullable = false)
    private String sourcePortal;

    @Column(name = "trigger_mode", length = 40, nullable = false)
    private String triggerMode;

    @Column(name = "raw_brokers_count", nullable = false)
    private Integer rawBrokersCount;

    @Column(name = "raw_rules_count", nullable = false)
    private Integer rawRulesCount;

    @Column(name = "duplicates_removed", nullable = false)
    private Integer duplicatesRemoved;

    @Column(name = "brokers_ingested", nullable = false)
    private Integer brokersIngested;

    @Column(name = "rules_ingested", nullable = false)
    private Integer rulesIngested;

    @Column(name = "duration_ms", nullable = false)
    private Long durationMs;

    @Column(name = "status", length = 30, nullable = false)
    private String status;

    @Column(name = "execution_log", nullable = false, columnDefinition = "TEXT")
    private String executionLog;

    @Column(name = "executed_at")
    private Instant executedAt;

    @PrePersist
    protected void onCreate() {
        if (this.executedAt == null) {
            this.executedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = "COMPLETED";
        }
    }
}


package com.partnerhub.domain.entity;

import com.partnerhub.domain.enums.BatchImportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "csv_import_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CsvImportBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "filename", length = 255, nullable = false)
    private String filename;

    @Column(name = "reference_month", length = 7, nullable = false)
    private String referenceMonth;

    @Column(name = "total_rows", nullable = false)
    private Integer totalRows;

    @Column(name = "valid_rows", nullable = false)
    private Integer validRows;

    @Column(name = "invalid_rows", nullable = false)
    private Integer invalidRows;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private BatchImportStatus status;

    @Column(name = "error_report", columnDefinition = "TEXT")
    private String errorReport;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}


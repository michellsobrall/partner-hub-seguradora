package com.partnerhub.dto.commission;

import com.partnerhub.domain.enums.BatchImportStatus;
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
public class CsvImportBatchDto {
    private UUID id;
    private String filename;
    private String referenceMonth;
    private Integer totalRows;
    private Integer validRows;
    private Integer invalidRows;
    private BatchImportStatus status;
    private String errorReport;
    private Instant createdAt;
}


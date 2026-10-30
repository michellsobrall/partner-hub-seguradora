package com.partnerhub.repository;

import com.partnerhub.domain.entity.CsvImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CsvImportBatchRepository extends JpaRepository<CsvImportBatch, UUID> {

    List<CsvImportBatch> findAllByOrderByCreatedAtDesc();
}


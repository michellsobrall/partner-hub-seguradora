package com.partnerhub.repository;

import com.partnerhub.domain.entity.CommissionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommissionEntryRepository extends JpaRepository<CommissionEntry, UUID> {

    List<CommissionEntry> findAllByOrderByCalculatedAtDesc();

    boolean existsBySaleId(UUID saleId);
}


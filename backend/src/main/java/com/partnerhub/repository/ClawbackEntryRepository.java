package com.partnerhub.repository;

import com.partnerhub.domain.entity.ClawbackEntry;
import com.partnerhub.domain.enums.ClawbackStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClawbackEntryRepository extends JpaRepository<ClawbackEntry, UUID> {

    List<ClawbackEntry> findAllByOrderByCreatedAtDesc();

    List<ClawbackEntry> findByBrokerIdAndReferenceMonthAndStatusNot(
            UUID brokerId,
            String referenceMonth,
            ClawbackStatus excludedStatus
    );
}


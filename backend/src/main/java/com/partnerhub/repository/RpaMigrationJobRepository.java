package com.partnerhub.repository;

import com.partnerhub.domain.entity.RpaMigrationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RpaMigrationJobRepository extends JpaRepository<RpaMigrationJob, UUID> {

    List<RpaMigrationJob> findAllByOrderByExecutedAtDesc();
}


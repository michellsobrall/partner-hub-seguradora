package com.partnerhub.repository;

import com.partnerhub.domain.entity.BrokerDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrokerDocumentRepository extends JpaRepository<BrokerDocument, UUID> {

    List<BrokerDocument> findByBrokerIdOrderByUploadedAtDesc(UUID brokerId);

    Optional<BrokerDocument> findByIdAndBrokerId(UUID id, UUID brokerId);
}


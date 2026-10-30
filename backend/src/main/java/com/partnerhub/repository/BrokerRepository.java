package com.partnerhub.repository;

import com.partnerhub.domain.entity.Broker;
import com.partnerhub.domain.enums.OnboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrokerRepository extends JpaRepository<Broker, UUID> {

    Optional<Broker> findByDocumentNumber(String documentNumber);

    Optional<Broker> findByEmailIgnoreCase(String email);

    List<Broker> findAllByOrderByCreatedAtDesc();

    List<Broker> findByStatusOrderByCreatedAtDesc(OnboardingStatus status);

    long countByStatus(OnboardingStatus status);
}


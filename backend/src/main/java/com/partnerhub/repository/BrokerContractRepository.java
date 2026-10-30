package com.partnerhub.repository;

import com.partnerhub.domain.entity.BrokerContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrokerContractRepository extends JpaRepository<BrokerContract, UUID> {

    Optional<BrokerContract> findByBrokerId(UUID brokerId);
}


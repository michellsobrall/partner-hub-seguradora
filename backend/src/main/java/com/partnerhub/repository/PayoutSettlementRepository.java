package com.partnerhub.repository;

import com.partnerhub.domain.entity.PayoutSettlement;
import com.partnerhub.domain.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayoutSettlementRepository extends JpaRepository<PayoutSettlement, UUID> {

    List<PayoutSettlement> findAllByOrderByReferenceMonthDescCreatedAtDesc();

    Optional<PayoutSettlement> findByBrokerIdAndReferenceMonth(UUID brokerId, String referenceMonth);

    Optional<PayoutSettlement> findByAsaasTransferId(String asaasTransferId);

    List<PayoutSettlement> findByStatusOrderByCreatedAtAsc(PayoutStatus status);
}


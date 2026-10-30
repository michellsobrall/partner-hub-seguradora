package com.partnerhub.repository;

import com.partnerhub.domain.entity.BrokerInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrokerInvoiceRepository extends JpaRepository<BrokerInvoice, UUID> {

    List<BrokerInvoice> findAllByOrderByUploadedAtDesc();

    Optional<BrokerInvoice> findFirstByBrokerIdAndReferenceMonthOrderByUploadedAtDesc(
            UUID brokerId,
            String referenceMonth
    );
}


package com.partnerhub.repository;

import com.partnerhub.domain.entity.PolicySale;
import com.partnerhub.domain.enums.SaleCalculationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PolicySaleRepository extends JpaRepository<PolicySale, UUID> {

    List<PolicySale> findByCalculationStatusOrderByCreatedAtAsc(SaleCalculationStatus status);

    List<PolicySale> findAllByOrderByCreatedAtDesc();

    Optional<PolicySale> findByProposalNumberIgnoreCaseAndInstallmentNumberAndReferenceMonth(
            String proposalNumber,
            Integer installmentNumber,
            String referenceMonth
    );

    long countByCalculationStatus(SaleCalculationStatus status);
}


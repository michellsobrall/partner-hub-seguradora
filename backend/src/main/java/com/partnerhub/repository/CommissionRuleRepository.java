package com.partnerhub.repository;

import com.partnerhub.domain.entity.CommissionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionRuleRepository extends JpaRepository<CommissionRule, UUID> {

    List<CommissionRule> findAllByOrderByOperatorNameAscProductNameAsc();

    Optional<CommissionRule> findByRuleCodeIgnoreCase(String ruleCode);

    Optional<CommissionRule> findFirstByOperatorNameIgnoreCaseAndProductNameIgnoreCaseAndActiveTrue(
            String operatorName,
            String productName
    );
}


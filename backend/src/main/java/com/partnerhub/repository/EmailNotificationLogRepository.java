package com.partnerhub.repository;

import com.partnerhub.domain.entity.EmailNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmailNotificationLogRepository extends JpaRepository<EmailNotificationLog, UUID> {
    List<EmailNotificationLog> findAllByOrderBySentAtDesc();
    List<EmailNotificationLog> findByBrokerIdOrderBySentAtDesc(UUID brokerId);
}


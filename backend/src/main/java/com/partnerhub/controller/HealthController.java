package com.partnerhub.controller;

import com.partnerhub.dto.HealthResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final DataSource dataSource;

    @Value("${spring.application.name:partnerhub-backend}")
    private String applicationName;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<HealthResponseDto> checkHealth() {
        Map<String, Object> details = new HashMap<>();
        boolean dbHealthy = false;
        String dbVersion = "unknown";

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            dbVersion = metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion();
            details.put("databaseProduct", metaData.getDatabaseProductName());
            details.put("databaseVersion", metaData.getDatabaseProductVersion());

            // Testa query na tabela gerada pela migração Flyway
            try (PreparedStatement stmt = connection.prepareStatement("SELECT system_version, environment, status FROM system_metadata WHERE id = 'partnerhub_core'");
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    details.put("schemaVersion", rs.getString("system_version"));
                    details.put("schemaStatus", rs.getString("status"));
                    details.put("schemaEnvironment", rs.getString("environment"));
                }
            }

            dbHealthy = true;
        } catch (Exception e) {
            details.put("error", e.getMessage());
        }

        HealthResponseDto response = HealthResponseDto.builder()
                .service(applicationName)
                .version("1.0.0")
                .status(dbHealthy ? "UP" : "DOWN")
                .database(dbHealthy ? "CONNECTED" : "DISCONNECTED")
                .timestamp(Instant.now())
                .details(details)
                .build();

        return dbHealthy
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
}

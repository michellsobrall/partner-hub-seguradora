package com.partnerhub.service;

import com.partnerhub.domain.entity.AppUser;
import com.partnerhub.domain.entity.Broker;
import com.partnerhub.domain.enums.UserRole;
import com.partnerhub.dto.auth.AuthResponseDto;
import com.partnerhub.dto.auth.DemoAccountDto;
import com.partnerhub.dto.auth.LoginRequestDto;
import com.partnerhub.repository.AppUserRepository;
import com.partnerhub.repository.BrokerRepository;
import com.partnerhub.security.JwtTokenProvider;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final UUID PRIME_BROKER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ROBERTO_BROKER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private final AppUserRepository appUserRepository;
    private final BrokerRepository brokerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            AppUserRepository appUserRepository,
            BrokerRepository brokerRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.appUserRepository = appUserRepository;
        this.brokerRepository = brokerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultUsers() {
        upsertDemoUser(
                "admin@partnerhub.com.br",
                "Admin@123",
                "Diretoria de Operações & Backoffice",
                UserRole.ADMIN,
                null
        );

        for (Broker broker : brokerRepository.findAllByOrderByCreatedAtDesc()) {
            upsertDemoUser(
                    broker.getEmail(),
                    "Partner@123",
                    broker.getName(),
                    UserRole.BROKER,
                    broker.getId()
            );
        }
    }

    public void upsertDemoUser(
            String email,
            String rawPassword,
            String fullName,
            UserRole role,
            UUID brokerId
    ) {
        if (email == null || email.isBlank()) {
            return;
        }
        Optional<AppUser> existing = appUserRepository.findByEmailIgnoreCase(email.trim());
        if (existing.isEmpty()) {
            AppUser user = AppUser.builder()
                    .email(email.trim().toLowerCase())
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .fullName(fullName)
                    .role(role)
                    .brokerId(brokerId)
                    .active(true)
                    .createdAt(Instant.now())
                    .build();
            appUserRepository.save(user);
        }
    }

    @Transactional
    public AuthResponseDto authenticate(LoginRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Caso o corretor tenha acabado de se cadastrar no Onboarding ou via RPA, garante criação de credencial
        Optional<AppUser> userOpt = appUserRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOpt.isEmpty()) {
            Optional<Broker> matchingBroker = brokerRepository.findAllByOrderByCreatedAtDesc().stream()
                    .filter(b -> b.getEmail() != null && b.getEmail().trim().equalsIgnoreCase(normalizedEmail))
                    .findFirst();
            if (matchingBroker.isPresent()) {
                Broker broker = matchingBroker.get();
                upsertDemoUser(broker.getEmail(), "Partner@123", broker.getName(), UserRole.BROKER, broker.getId());
                userOpt = appUserRepository.findByEmailIgnoreCase(normalizedEmail);
            }
        }

        AppUser user = userOpt
                .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas. Verifique seu e-mail e senha."));

        if (!user.isActive()) {
            throw new IllegalArgumentException("Esta conta de acesso encontra-se desativada.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciais inválidas. Verifique seu e-mail e senha.");
        }

        user.setLastLoginAt(Instant.now());
        appUserRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponseDto getCurrentUser(String email) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Sessão expirada ou usuário não encontrado."));
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public List<DemoAccountDto> getDemoAccounts() {
        List<DemoAccountDto> accounts = new ArrayList<>();

        accounts.add(DemoAccountDto.builder()
                .label("Administrador Backoffice (Visão Completa)")
                .description("Acesso irrestrito a Onboarding, Motor de Comissões, Financeiro Asaas, RPA e todos os Corretores.")
                .email("admin@partnerhub.com.br")
                .password("Admin@123")
                .role(UserRole.ADMIN)
                .brokerId(null)
                .build());

        List<Broker> brokers = brokerRepository.findAllByOrderByCreatedAtDesc();
        for (Broker broker : brokers) {
            accounts.add(DemoAccountDto.builder()
                    .label("Corretor Parceiro [" + broker.getPersonType() + "] — " + broker.getName())
                    .description("Acesso exclusivo ao Portal do Corretor vinculado ao CPF/CNPJ " + broker.getDocumentNumber())
                    .email(broker.getEmail())
                    .password("Partner@123")
                    .role(UserRole.BROKER)
                    .brokerId(broker.getId())
                    .build());
        }

        return accounts;
    }

    private AuthResponseDto buildAuthResponse(AppUser user) {
        String token = jwtTokenProvider.generateToken(user);
        String brokerName = null;
        String brokerDocument = null;

        if (user.getBrokerId() != null) {
            Optional<Broker> brokerOpt = brokerRepository.findById(user.getBrokerId());
            if (brokerOpt.isPresent()) {
                brokerName = brokerOpt.get().getName();
                brokerDocument = brokerOpt.get().getDocumentNumber();
            }
        }

        return AuthResponseDto.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInMs(jwtTokenProvider.getJwtExpirationMs())
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .brokerId(user.getBrokerId())
                .brokerName(brokerName)
                .brokerDocument(brokerDocument)
                .authenticatedAt(Instant.now())
                .build();
    }
}

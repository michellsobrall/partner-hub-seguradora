package com.partnerhub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.partnerhub.domain.entity.*;
import com.partnerhub.domain.enums.CommissionEntryStatus;
import com.partnerhub.domain.enums.InvoiceStatus;
import com.partnerhub.domain.enums.PersonType;
import com.partnerhub.dto.finance.EmailNotificationDto;
import com.partnerhub.dto.finance.IntegrationStatusDto;
import com.partnerhub.repository.BrokerInvoiceRepository;
import com.partnerhub.repository.BrokerRepository;
import com.partnerhub.repository.CommissionEntryRepository;
import com.partnerhub.repository.EmailNotificationLogRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    @Value("${app.mail.sendgrid-api-key:}")
    private String sendgridApiKey;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${spring.mail.port:587}")
    private int smtpPort;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    @Value("${app.mail.from-address:no-reply@partnerhub.com.br}")
    private String fromAddress;

    @Value("${app.mail.nfse-deadline-day:5}")
    private int nfseDeadlineDay;

    private final EmailNotificationLogRepository logRepository;
    private final BrokerRepository brokerRepository;
    private final CommissionEntryRepository commissionEntryRepository;
    private final BrokerInvoiceRepository invoiceRepository;
    private final AsaasGatewayClient asaasGatewayClient;
    private final JavaMailSender mailSender;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public EmailNotificationService(
            EmailNotificationLogRepository logRepository,
            BrokerRepository brokerRepository,
            CommissionEntryRepository commissionEntryRepository,
            BrokerInvoiceRepository invoiceRepository,
            AsaasGatewayClient asaasGatewayClient,
            Optional<JavaMailSender> mailSender
    ) {
        this.logRepository = logRepository;
        this.brokerRepository = brokerRepository;
        this.commissionEntryRepository = commissionEntryRepository;
        this.invoiceRepository = invoiceRepository;
        this.asaasGatewayClient = asaasGatewayClient;
        this.mailSender = mailSender.orElse(null);
    }

    public IntegrationStatusDto updateRuntimeIntegrations(com.partnerhub.dto.finance.IntegrationConfigRequestDto req) {
        if (req.getAsaasApiUrl() != null && !req.getAsaasApiUrl().isBlank()) {
            asaasGatewayClient.updateRuntimeConfig(req.getAsaasApiUrl(), null);
        }
        if (req.getAsaasApiKey() != null && !req.getAsaasApiKey().isBlank()) {
            asaasGatewayClient.updateRuntimeConfig(req.getAsaasApiUrl(), req.getAsaasApiKey());
        }
        if (req.getSendgridApiKey() != null && !req.getSendgridApiKey().isBlank()) {
            this.sendgridApiKey = req.getSendgridApiKey().trim();
        }
        if (req.getSmtpHost() != null && !req.getSmtpHost().isBlank()) {
            this.smtpHost = req.getSmtpHost().trim();
        }
        if (req.getSmtpPort() != null && req.getSmtpPort() > 0) {
            this.smtpPort = req.getSmtpPort();
        }
        if (req.getSmtpUsername() != null && !req.getSmtpUsername().isBlank()) {
            this.smtpUsername = req.getSmtpUsername().trim();
        }
        if (req.getSmtpPassword() != null && !req.getSmtpPassword().isBlank()) {
            this.smtpPassword = req.getSmtpPassword().trim();
        }
        if (req.getEmailFromAddress() != null && !req.getEmailFromAddress().isBlank()) {
            this.fromAddress = req.getEmailFromAddress().trim();
        }
        if (req.getNfseDeadlineDay() != null && req.getNfseDeadlineDay() >= 1 && req.getNfseDeadlineDay() <= 28) {
            this.nfseDeadlineDay = req.getNfseDeadlineDay();
        }
        return getIntegrationStatus();
    }

    public boolean isSendGridConfigured() {
        return sendgridApiKey != null && !sendgridApiKey.isBlank();
    }

    public boolean isSmtpConfigured() {
        return smtpUsername != null && !smtpUsername.isBlank()
                && smtpPassword != null && !smtpPassword.isBlank();
    }

    public String getActiveEmailProvider() {
        if (isSendGridConfigured()) {
            return "SENDGRID_API_V3";
        }
        if (isSmtpConfigured()) {
            return "SMTP_JAVAMAIL";
        }
        return "SMTP_SANDBOX_OUTBOX";
    }

    @Transactional(readOnly = true)
    public IntegrationStatusDto getIntegrationStatus() {
        return IntegrationStatusDto.builder()
                .asaasLiveKeyConfigured(asaasGatewayClient.isLiveKeyConfigured())
                .asaasMode(asaasGatewayClient.getIntegrationMode())
                .asaasApiUrl(asaasGatewayClient.getAsaasApiUrl())
                .emailLiveConfigured(isSendGridConfigured() || isSmtpConfigured())
                .emailProvider(getActiveEmailProvider())
                .smtpHost(smtpHost)
                .smtpPort(smtpPort)
                .smtpUsername(smtpUsername)
                .emailFromAddress(fromAddress)
                .nfseDeadlineDay(nfseDeadlineDay)
                .totalEmailsDispatched(logRepository.count())
                .build();
    }

    @Transactional(readOnly = true)
    public List<EmailNotificationDto> listNotifications() {
        return logRepository.findAllByOrderBySentAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmailNotificationDto resendNotification(UUID notificationId) {
        EmailNotificationLog existing = logRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Registro de e-mail não encontrado."));

        String htmlBody = "<div style='font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>"
                + "<h2 style='color:#0f172a;margin-top:0;'>" + existing.getSubject() + "</h2>"
                + "<p style='color:#334155;font-size:14px;line-height:1.6;'>" + existing.getBodyPreview() + "</p>"
                + "</div>";

        logRepository.delete(existing);
        return dispatchAndRecord(
                existing.getBrokerId(),
                existing.getRecipientEmail(),
                existing.getRecipientName(),
                existing.getTemplateCode(),
                existing.getSubject(),
                existing.getBodyPreview(),
                htmlBody
        );
    }

    @Transactional
    public EmailNotificationDto sendTestEmail(String targetEmail) {
        String recipient = (targetEmail != null && !targetEmail.isBlank())
                ? targetEmail.trim()
                : "michel.silva@grupohermanos.com.br";

        String subject = "🚀 [Partner Hub] Teste de Conexão SMTP / E-mail Transacional";
        String bodyPreview = String.format(
                "Este é um disparo de teste em tempo real do Partner Hub utilizando o servidor SMTP '%s:%d' (Remetente: %s) para validar a entrega de e-mails de Contratos e Alertas de NFS-e.",
                this.smtpHost,
                this.smtpPort,
                this.fromAddress
        );

        String htmlBody = "<div style='font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>"
                + "<h2 style='color:#4f46e5;margin-top:0;'>🚀 Teste de E-mail Partner Hub Concluído!</h2>"
                + "<p style='color:#334155;font-size:14px;line-height:1.6;'>" + bodyPreview + "</p>"
                + "<div style='background:#f8fafc;padding:14px;border-radius:8px;margin-top:16px;font-size:12px;color:#475569;'>"
                + "<strong>Servidor SMTP:</strong> " + this.smtpHost + ":" + this.smtpPort + "<br/>"
                + "<strong>Usuário Autenticado:</strong> " + this.smtpUsername + "<br/>"
                + "<strong>Remetente (From):</strong> " + this.fromAddress
                + "</div>"
                + "</div>";

        return dispatchAndRecord(
                null,
                recipient,
                "Destinatário de Teste SMTP",
                "SMTP_CONNECTION_TEST",
                subject,
                bodyPreview,
                htmlBody
        );
    }

    @Transactional
    public EmailNotificationDto sendContractApprovedEmail(Broker broker) {
        String contractNumber = broker.getContract() != null
                ? broker.getContract().getContractNumber()
                : "PH-CTR-OFICIAL";

        String subject = "[Partner Hub] Contrato Homologado! Credenciamento Aprovado (" + contractNumber + ")";
        String bodyPreview = String.format(
                "Olá %s! Temos o prazer de informar que o seu Contrato de Parceria Comercial (%s) e seu domicílio bancário foram aprovados pela Mesa de Compliance. Seu acesso ao Portal do Corretor já está liberado com o login '%s' (Senha padrão: Partner@123).",
                broker.getName(),
                contractNumber,
                broker.getEmail()
        );

        String htmlBody = "<div style='font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>"
                + "<h2 style='color:#0f172a;margin-top:0;'>Credenciamento Homologado com Sucesso!</h2>"
                + "<p style='color:#334155;font-size:14px;line-height:1.6;'>" + bodyPreview + "</p>"
                + "<div style='background:#f8fafc;padding:16px;border-radius:8px;margin-top:16px;font-size:13px;color:#475569;'>"
                + "<strong>Contrato Digital:</strong> " + contractNumber + "<br/>"
                + "<strong>CPF/CNPJ:</strong> " + broker.getDocumentNumber() + "<br/>"
                + "<strong>Status:</strong> APROVADO / HOMOLOGADO"
                + "</div>"
                + "</div>";

        return dispatchAndRecord(
                broker.getId(),
                broker.getEmail(),
                broker.getName(),
                "CONTRACT_APPROVED",
                subject,
                bodyPreview,
                htmlBody
        );
    }

    @Transactional
    public EmailNotificationDto sendPayoutConfirmedEmail(PayoutSettlement settlement) {
        Broker broker = settlement.getBroker();
        String subject = "[Partner Hub] Comprovante de Repasse Liquidado (" + settlement.getTransferMethod() + " - Comp. " + settlement.getReferenceMonth() + ")";
        String bodyPreview = String.format(
                "Confirmamos a liquidação do fechamento #%s referente à competência %s no valor líquido de R$ %s via %s (ID Asaas: %s). Comprovante: %s",
                settlement.getId().toString().substring(0, 8).toUpperCase(),
                settlement.getReferenceMonth(),
                settlement.getNetPayoutAmount(),
                settlement.getTransferMethod(),
                settlement.getAsaasTransferId(),
                settlement.getAsaasReceiptUrl()
        );

        String htmlBody = "<div style='font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>"
                + "<h2 style='color:#059669;margin-top:0;'>Comissão Liquidada via Asaas (" + settlement.getTransferMethod() + ")</h2>"
                + "<p style='color:#334155;font-size:14px;line-height:1.6;'>" + bodyPreview + "</p>"
                + "</div>";

        return dispatchAndRecord(
                broker.getId(),
                broker.getEmail(),
                broker.getName(),
                "ASAAS_PAYOUT_CONFIRMED",
                subject,
                bodyPreview,
                htmlBody
        );
    }

    /**
     * Rotina agendada diariamente às 09:00 AM que verifica se faltam 3 dias para o dia limite de NFS-e
     * (por padrão dia 05 -> dispara automaticamente no dia 02). Também pode ser acionada manualmente pela UI!
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void scheduledNfseDeadlineCheck() {
        int todayDay = LocalDate.now().getDayOfMonth();
        int triggerDay = Math.max(1, nfseDeadlineDay - 3);
        if (todayDay == triggerDay) {
            String currentRefMonth = YearMonth.now().toString();
            triggerNfseDeadlineReminders(currentRefMonth);
        }
    }

    @Transactional
    public List<EmailNotificationDto> triggerNfseDeadlineReminders(String referenceMonth) {
        String targetMonth = (referenceMonth != null && !referenceMonth.isBlank())
                ? referenceMonth.trim()
                : "2026-10";

        List<Broker> pjBrokers = brokerRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(b -> b.getPersonType() == PersonType.PJ)
                .collect(Collectors.toList());

        List<EmailNotificationDto> sentNotifications = new ArrayList<>();

        List<CommissionEntry> globalEntries = commissionEntryRepository.findAllByOrderByCalculatedAtDesc();

        for (Broker broker : pjBrokers) {
            List<CommissionEntry> allEntries = globalEntries.stream()
                    .filter(e -> e.getBroker().getId().equals(broker.getId()))
                    .collect(Collectors.toList());

            // Soma comissões aprovadas/calculadas na competência alvo (ou em qualquer competência aberta caso não haja na alvo)
            BigDecimal openCommission = allEntries.stream()
                    .filter(e -> e.getStatus() == CommissionEntryStatus.CALCULATED || e.getStatus() == CommissionEntryStatus.APPROVED_FOR_PAYMENT)
                    .filter(e -> targetMonth.equals(e.getReferenceMonth()) || allEntries.stream().noneMatch(x -> targetMonth.equals(x.getReferenceMonth())))
                    .map(CommissionEntry::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (openCommission.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            boolean hasValidInvoice = invoiceRepository
                    .findFirstByBrokerIdAndReferenceMonthOrderByUploadedAtDesc(broker.getId(), targetMonth)
                    .map(inv -> inv.getStatus() == InvoiceStatus.APPROVED || inv.getStatus() == InvoiceStatus.PENDING_REVIEW)
                    .orElse(false);

            if (!hasValidInvoice) {
                String subject = "⚠️ [Partner Hub] Faltam 3 dias para o envio da NFS-e — Competência " + targetMonth;
                String bodyPreview = String.format(
                        "Atenção %s (CNPJ %s): Seu saldo de comissões de R$ %s referente à competência %s já está apurado, porém restam apenas 3 dias para o prazo limite fiscal (Dia %02d). Envie sua NFS-e no Portal do Corretor para garantir a liberação no lote Pix/TED do Asaas.",
                        broker.getName(),
                        broker.getDocumentNumber(),
                        openCommission,
                        targetMonth,
                        nfseDeadlineDay
                );

                String htmlBody = "<div style='font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #fcd34d;background:#fffbeb;border-radius:12px;'>"
                        + "<h2 style='color:#b45309;margin-top:0;'>⚠️ Prazo Limite de NFS-e: Faltam 3 Dias</h2>"
                        + "<p style='color:#78350f;font-size:14px;line-height:1.6;'>" + bodyPreview + "</p>"
                        + "</div>";

                sentNotifications.add(dispatchAndRecord(
                        broker.getId(),
                        broker.getEmail(),
                        broker.getName(),
                        "NFSE_DEADLINE_3_DAYS",
                        subject,
                        bodyPreview,
                        htmlBody
                ));
            }
        }

        return sentNotifications;
    }

    private EmailNotificationDto dispatchAndRecord(
            UUID brokerId,
            String recipientEmail,
            String recipientName,
            String templateCode,
            String subject,
            String bodyPreview,
            String htmlBody
    ) {
        String provider = getActiveEmailProvider();
        String status = "DELIVERED";
        String externalId = "msg_ph_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        if (isSendGridConfigured()) {
            try {
                Map<String, Object> payload = Map.of(
                        "personalizations", List.of(Map.of(
                                "to", List.of(Map.of("email", recipientEmail, "name", recipientName))
                        )),
                        "from", Map.of("email", fromAddress, "name", "Partner Hub Comissões"),
                        "subject", subject,
                        "content", List.of(Map.of("type", "text/html", "value", htmlBody))
                );

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
                        .header("Authorization", "Bearer " + sendgridApiKey.trim())
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    status = "SENT_SENDGRID_LIVE";
                    externalId = response.headers().firstValue("X-Message-Id").orElse(externalId);
                } else {
                    log.warn("[EmailService] SendGrid retornou HTTP {}. Mantendo registro em Outbox.", response.statusCode());
                    status = "LOGGED_FALLBACK";
                }
            } catch (Exception e) {
                log.warn("[EmailService] Falha ao comunicar com SendGrid ({}). Registrando no Outbox.", e.getMessage());
                status = "LOGGED_FALLBACK";
            }
        } else if (isSmtpConfigured()) {
            List<String> candidateUsers = new ArrayList<>();
            candidateUsers.add(this.smtpUsername.trim());
            if (this.fromAddress != null
                    && !this.fromAddress.isBlank()
                    && !this.fromAddress.trim().equalsIgnoreCase(this.smtpUsername.trim())) {
                candidateUsers.add(this.fromAddress.trim());
            }
            if (this.smtpUsername.contains("@")) {
                candidateUsers.add(this.smtpUsername.substring(0, this.smtpUsername.indexOf('@')).trim());
            }

            boolean sentOk = false;
            String lastSmtpError = "";

            outer:
            for (String candidateUser : candidateUsers) {
                for (boolean useStartTls : new boolean[]{true, false}) {
                    try {
                        sendViaJavaMail(candidateUser, useStartTls, recipientEmail, subject, htmlBody);
                        status = "SENT_SMTP_LIVE";
                        sentOk = true;
                        log.info("[EmailService SMTP] E-mail enviado com sucesso via {}:{} (user={}, starttls={}) para <{}>",
                                this.smtpHost, this.smtpPort, candidateUser, useStartTls, recipientEmail);
                        break outer;
                    } catch (Exception ex) {
                        lastSmtpError = extractRootCauseMessage(ex);
                        log.warn("[EmailService SMTP] Tentativa falhou (user={}, starttls={}): {}",
                                candidateUser, useStartTls, lastSmtpError);
                    }
                }
            }

            if (!sentOk) {
                status = "SMTP_AUTH_REJECTED";
                bodyPreview = "[Resposta do Servidor " + this.smtpHost + ":" + this.smtpPort + " -> "
                        + lastSmtpError + "] — " + bodyPreview;
            }
        } else {
            log.info("[EmailService Outbox] E-mail '{}' preparado e auditado para <{}>", subject, recipientEmail);
        }

        EmailNotificationLog entity = EmailNotificationLog.builder()
                .brokerId(brokerId)
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .templateCode(templateCode)
                .subject(subject)
                .bodyPreview(bodyPreview)
                .provider(provider)
                .deliveryStatus(status)
                .externalMessageId(externalId)
                .sentAt(Instant.now())
                .build();

        EmailNotificationLog saved = logRepository.save(entity);
        return toDto(saved);
    }

    private void sendViaJavaMail(
            String authUser,
            boolean useStartTls,
            String recipientEmail,
            String subject,
            String htmlBody
    ) throws Exception {
        org.springframework.mail.javamail.JavaMailSenderImpl dynamicSender =
                new org.springframework.mail.javamail.JavaMailSenderImpl();
        dynamicSender.setHost(this.smtpHost);
        dynamicSender.setPort(this.smtpPort);
        dynamicSender.setUsername(authUser);
        dynamicSender.setPassword(this.smtpPassword);
        dynamicSender.setDefaultEncoding("UTF-8");

        Properties props = dynamicSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        if (this.smtpPort == 465) {
            props.put("mail.smtp.ssl.enable", "true");
        } else {
            props.put("mail.smtp.starttls.enable", String.valueOf(useStartTls));
        }
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.ssl.trust", "*");
        props.put("mail.smtp.connectiontimeout", "6000");
        props.put("mail.smtp.timeout", "6000");
        props.put("mail.smtp.writetimeout", "6000");

        MimeMessage mimeMessage = dynamicSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
        String effectiveFrom = (this.fromAddress != null && !this.fromAddress.isBlank())
                ? this.fromAddress
                : authUser;
        helper.setFrom(effectiveFrom, "Partner Hub Comissoes");
        helper.setTo(recipientEmail);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        dynamicSender.send(mimeMessage);
    }

    private String extractRootCauseMessage(Throwable t) {
        Throwable curr = t;
        while (curr.getCause() != null && curr.getCause() != curr) {
            curr = curr.getCause();
        }
        return curr.getMessage() != null ? curr.getMessage().trim() : t.toString();
    }

    private EmailNotificationDto toDto(EmailNotificationLog entity) {
        return EmailNotificationDto.builder()
                .id(entity.getId())
                .brokerId(entity.getBrokerId())
                .recipientEmail(entity.getRecipientEmail())
                .recipientName(entity.getRecipientName())
                .templateCode(entity.getTemplateCode())
                .subject(entity.getSubject())
                .bodyPreview(entity.getBodyPreview())
                .provider(entity.getProvider())
                .deliveryStatus(entity.getDeliveryStatus())
                .externalMessageId(entity.getExternalMessageId())
                .sentAt(entity.getSentAt())
                .build();
    }
}

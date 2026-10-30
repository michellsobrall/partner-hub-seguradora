package com.partnerhub.service;

import com.partnerhub.domain.entity.Broker;
import com.partnerhub.domain.entity.BrokerBankAccount;
import com.partnerhub.domain.entity.BrokerContract;
import com.partnerhub.domain.entity.BrokerDocument;
import com.partnerhub.domain.enums.DocumentType;
import com.partnerhub.domain.enums.OnboardingStatus;
import com.partnerhub.dto.onboarding.*;
import com.partnerhub.repository.BrokerDocumentRepository;
import com.partnerhub.repository.BrokerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class BrokerOnboardingService {

    private final BrokerRepository brokerRepository;
    private final BrokerDocumentRepository documentRepository;
    private final ContractPdfService contractPdfService;

    public BrokerOnboardingService(
            BrokerRepository brokerRepository,
            BrokerDocumentRepository documentRepository,
            ContractPdfService contractPdfService
    ) {
        this.brokerRepository = brokerRepository;
        this.documentRepository = documentRepository;
        this.contractPdfService = contractPdfService;
    }

    @Transactional(readOnly = true)
    public List<BrokerResponseDto> listBrokers(OnboardingStatus status, String search) {
        List<Broker> brokers = (status != null)
                ? brokerRepository.findByStatusOrderByCreatedAtDesc(status)
                : brokerRepository.findAllByOrderByCreatedAtDesc();

        if (search != null && !search.isBlank()) {
            String term = search.trim().toLowerCase();
            brokers = brokers.stream()
                    .filter(b -> b.getName().toLowerCase().contains(term)
                            || b.getDocumentNumber().toLowerCase().contains(term)
                            || b.getEmail().toLowerCase().contains(term)
                            || (b.getTradeName() != null && b.getTradeName().toLowerCase().contains(term)))
                    .collect(Collectors.toList());
        }

        return brokers.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BrokerStatsDto getStats() {
        long pending = brokerRepository.countByStatus(OnboardingStatus.PENDING);
        long underReview = brokerRepository.countByStatus(OnboardingStatus.UNDER_REVIEW);
        long approved = brokerRepository.countByStatus(OnboardingStatus.APPROVED);
        long rejected = brokerRepository.countByStatus(OnboardingStatus.REJECTED);

        return BrokerStatsDto.builder()
                .total(pending + underReview + approved + rejected)
                .pending(pending)
                .underReview(underReview)
                .approved(approved)
                .rejected(rejected)
                .build();
    }

    @Transactional(readOnly = true)
    public BrokerResponseDto getBrokerById(UUID id) {
        Broker broker = findEntityById(id);
        return toResponseDto(broker);
    }

    @Transactional
    public BrokerResponseDto createOnboarding(BrokerOnboardingRequestDto request) {
        String cleanDoc = normalizeDigits(request.getDocumentNumber());
        if (cleanDoc.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF/CNPJ inválido.");
        }

        if (brokerRepository.findByDocumentNumber(cleanDoc).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um corretor cadastrado com este CPF/CNPJ.");
        }

        if (brokerRepository.findByEmailIgnoreCase(request.getEmail().trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um corretor cadastrado com este e-mail.");
        }

        Broker broker = Broker.builder()
                .personType(request.getPersonType())
                .name(request.getName().trim())
                .tradeName(request.getTradeName() != null ? request.getTradeName().trim() : null)
                .documentNumber(cleanDoc)
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone().trim())
                .susepCode(request.getSusepCode() != null ? request.getSusepCode().trim() : null)
                .status(OnboardingStatus.PENDING)
                .build();

        BankAccountRequestDto bankReq = request.getBankAccount();
        BrokerBankAccount bankAccount = BrokerBankAccount.builder()
                .broker(broker)
                .bankCode(bankReq.getBankCode().trim())
                .bankName(bankReq.getBankName().trim())
                .agency(bankReq.getAgency().trim())
                .accountNumber(bankReq.getAccountNumber().trim())
                .accountType(bankReq.getAccountType())
                .pixKey(bankReq.getPixKey() != null && !bankReq.getPixKey().isBlank() ? bankReq.getPixKey().trim() : null)
                .pixKeyType(bankReq.getPixKey() != null && !bankReq.getPixKey().isBlank() ? bankReq.getPixKeyType() : null)
                .isPrimary(true)
                .build();

        broker.getBankAccounts().add(bankAccount);

        String contractNumber = String.format("PH-CTR-%d-%04d",
                Year.now().getValue(),
                ThreadLocalRandom.current().nextInt(1000, 9999));

        String termsText = contractPdfService.buildContractTerms(broker, bankAccount, contractNumber);
        String contractHash = contractPdfService.computeSha256(termsText);

        BrokerContract contract = BrokerContract.builder()
                .broker(broker)
                .contractNumber(contractNumber)
                .contractVersion("1.0")
                .termsText(termsText)
                .documentHashSha256(contractHash)
                .signed(false)
                .build();

        broker.setContract(contract);

        Broker saved = brokerRepository.save(broker);
        return toResponseDto(saved);
    }

    @Transactional
    public BrokerDocumentDto uploadDocument(UUID brokerId, DocumentType documentType, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio ou inválido.");
        }

        Broker broker = findEntityById(brokerId);

        try {
            byte[] bytes = file.getBytes();
            String sha256 = contractPdfService.computeSha256(bytes);
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : documentType.name() + ".pdf";
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

            // Remove documento anterior do mesmo tipo, se houver, para manter versão única limpa
            broker.getDocuments().removeIf(doc -> doc.getDocumentType() == documentType);

            BrokerDocument doc = BrokerDocument.builder()
                    .broker(broker)
                    .documentType(documentType)
                    .originalFilename(filename)
                    .contentType(contentType)
                    .fileSize(file.getSize())
                    .sha256Hash(sha256)
                    .fileContent(bytes)
                    .uploadedAt(Instant.now())
                    .build();

            BrokerDocument savedDoc = documentRepository.save(doc);
            return toDocumentDto(savedDoc);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao processar bytes do documento.");
        }
    }

    @Transactional(readOnly = true)
    public BrokerDocument getDocumentEntity(UUID brokerId, UUID documentId) {
        return documentRepository.findByIdAndBrokerId(documentId, brokerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento não encontrado."));
    }

    @Transactional
    public BrokerResponseDto signContract(
            UUID brokerId,
            ContractSignRequestDto request,
            String clientIp,
            String userAgent
    ) {
        if (!Boolean.TRUE.equals(request.getAcceptedTerms())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "É necessário aceitar os termos contratuais para assinar.");
        }

        Broker broker = findEntityById(brokerId);
        BrokerContract contract = broker.getContract();
        if (contract == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não localizado para este corretor.");
        }

        Instant signedAt = Instant.now();
        String auditPayload = contract.getTermsText()
                + "|SIGNER:" + request.getSignerName().trim()
                + "|DOC:" + normalizeDigits(request.getSignerDocument())
                + "|IP:" + clientIp
                + "|UTC:" + signedAt.toString();

        contract.setSigned(true);
        contract.setSignerName(request.getSignerName().trim());
        contract.setSignerDocument(normalizeDigits(request.getSignerDocument()));
        contract.setSignerIp(clientIp);
        contract.setSignerUserAgent(userAgent);
        contract.setSignedAt(signedAt);
        contract.setDocumentHashSha256(contractPdfService.computeSha256(auditPayload));

        // Ao assinar o contrato, avança automaticamente de PENDING para UNDER_REVIEW
        if (broker.getStatus() == OnboardingStatus.PENDING) {
            broker.setStatus(OnboardingStatus.UNDER_REVIEW);
            broker.setReviewNotes("Contrato assinado eletronicamente (Click-to-Sign). Aguardando aprovação da mesa de compliance.");
        }

        Broker saved = brokerRepository.save(broker);
        return toResponseDto(saved);
    }

    @Transactional
    public BrokerResponseDto updateWorkflowStatus(UUID brokerId, StatusUpdateRequestDto request) {
        Broker broker = findEntityById(brokerId);
        broker.setStatus(request.getStatus());
        broker.setReviewNotes(request.getReviewNotes());
        broker.setReviewedAt(Instant.now());

        Broker saved = brokerRepository.save(broker);
        return toResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public byte[] generateContractPdfBytes(UUID brokerId) {
        Broker broker = findEntityById(brokerId);
        if (broker.getContract() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado.");
        }
        return contractPdfService.generateContractPdf(broker);
    }

    private Broker findEntityById(UUID id) {
        return brokerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Corretor não encontrado."));
    }

    private String normalizeDigits(String input) {
        return input == null ? "" : input.replaceAll("\\D", "");
    }

    private BrokerResponseDto toResponseDto(Broker broker) {
        BrokerBankAccount primaryBank = broker.getBankAccounts().isEmpty()
                ? null
                : broker.getBankAccounts().get(0);

        BankAccountRequestDto bankDto = primaryBank == null ? null : BankAccountRequestDto.builder()
                .id(primaryBank.getId())
                .bankCode(primaryBank.getBankCode())
                .bankName(primaryBank.getBankName())
                .agency(primaryBank.getAgency())
                .accountNumber(primaryBank.getAccountNumber())
                .accountType(primaryBank.getAccountType())
                .pixKey(primaryBank.getPixKey())
                .pixKeyType(primaryBank.getPixKeyType())
                .build();

        List<BrokerDocumentDto> docDtos = broker.getDocuments().stream()
                .map(this::toDocumentDto)
                .collect(Collectors.toList());

        BrokerContract contract = broker.getContract();
        BrokerContractDto contractDto = contract == null ? null : BrokerContractDto.builder()
                .id(contract.getId())
                .contractNumber(contract.getContractNumber())
                .contractVersion(contract.getContractVersion())
                .termsText(contract.getTermsText())
                .documentHashSha256(contract.getDocumentHashSha256())
                .signed(contract.getSigned())
                .signerName(contract.getSignerName())
                .signerDocument(contract.getSignerDocument())
                .signerIp(contract.getSignerIp())
                .signerUserAgent(contract.getSignerUserAgent())
                .signedAt(contract.getSignedAt())
                .createdAt(contract.getCreatedAt())
                .build();

        return BrokerResponseDto.builder()
                .id(broker.getId())
                .personType(broker.getPersonType())
                .name(broker.getName())
                .tradeName(broker.getTradeName())
                .documentNumber(broker.getDocumentNumber())
                .email(broker.getEmail())
                .phone(broker.getPhone())
                .susepCode(broker.getSusepCode())
                .status(broker.getStatus())
                .reviewNotes(broker.getReviewNotes())
                .reviewedAt(broker.getReviewedAt())
                .createdAt(broker.getCreatedAt())
                .updatedAt(broker.getUpdatedAt())
                .bankAccount(bankDto)
                .documents(docDtos)
                .contract(contractDto)
                .build();
    }

    private BrokerDocumentDto toDocumentDto(BrokerDocument doc) {
        return BrokerDocumentDto.builder()
                .id(doc.getId())
                .documentType(doc.getDocumentType())
                .originalFilename(doc.getOriginalFilename())
                .contentType(doc.getContentType())
                .fileSize(doc.getFileSize())
                .sha256Hash(doc.getSha256Hash())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }
}


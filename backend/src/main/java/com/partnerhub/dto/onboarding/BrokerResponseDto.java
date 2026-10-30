package com.partnerhub.dto.onboarding;

import com.partnerhub.domain.enums.OnboardingStatus;
import com.partnerhub.domain.enums.PersonType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerResponseDto {
    private UUID id;
    private PersonType personType;
    private String name;
    private String tradeName;
    private String documentNumber;
    private String email;
    private String phone;
    private String susepCode;
    private OnboardingStatus status;
    private String reviewNotes;
    private Instant reviewedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private BankAccountRequestDto bankAccount;
    private List<BrokerDocumentDto> documents;
    private BrokerContractDto contract;
}


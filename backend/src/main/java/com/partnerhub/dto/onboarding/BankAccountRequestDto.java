package com.partnerhub.dto.onboarding;

import com.partnerhub.domain.enums.AccountType;
import com.partnerhub.domain.enums.PixKeyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountRequestDto {

    private UUID id;

    @NotBlank(message = "O código do banco é obrigatório.")
    private String bankCode;

    @NotBlank(message = "O nome da instituição bancária é obrigatório.")
    private String bankName;

    @NotBlank(message = "A agência bancária é obrigatória.")
    private String agency;

    @NotBlank(message = "O número da conta é obrigatório.")
    private String accountNumber;

    @NotNull(message = "O tipo de conta é obrigatório (CHECKING ou SAVINGS).")
    private AccountType accountType;

    private String pixKey;

    private PixKeyType pixKeyType;
}


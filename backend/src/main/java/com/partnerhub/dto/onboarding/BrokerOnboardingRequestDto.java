package com.partnerhub.dto.onboarding;

import com.partnerhub.domain.enums.PersonType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerOnboardingRequestDto {

    @NotNull(message = "O tipo de pessoa (PF ou PJ) é obrigatório.")
    private PersonType personType;

    @NotBlank(message = "O nome completo ou razão social é obrigatório.")
    private String name;

    private String tradeName;

    @NotBlank(message = "O CPF ou CNPJ é obrigatório.")
    private String documentNumber;

    @NotBlank(message = "O e-mail corporativo/contato é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    private String email;

    @NotBlank(message = "O telefone/WhatsApp é obrigatório.")
    private String phone;

    private String susepCode;

    @Valid
    @NotNull(message = "Os dados bancários para liquidação são obrigatórios.")
    private BankAccountRequestDto bankAccount;
}


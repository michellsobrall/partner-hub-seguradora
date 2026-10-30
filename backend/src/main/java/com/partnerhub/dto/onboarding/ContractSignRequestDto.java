package com.partnerhub.dto.onboarding;

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
public class ContractSignRequestDto {

    @NotNull(message = "A confirmação de aceite dos termos é obrigatória.")
    private Boolean acceptedTerms;

    @NotBlank(message = "O nome do signatário responsável é obrigatório.")
    private String signerName;

    @NotBlank(message = "O CPF/CNPJ do signatário é obrigatório.")
    private String signerDocument;
}


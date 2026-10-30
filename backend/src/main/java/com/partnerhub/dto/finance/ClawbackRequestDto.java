package com.partnerhub.dto.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClawbackRequestDto {

    @NotNull(message = "Selecione o corretor para lançamento do estorno.")
    private UUID brokerId;

    @NotBlank(message = "O número da proposta/apólice é obrigatório.")
    private String proposalNumber;

    @NotBlank(message = "O nome do beneficiário/estipulante é obrigatório.")
    private String beneficiaryName;

    @NotBlank(message = "A justificativa do estorno/clawback é obrigatória.")
    private String reason;

    @NotBlank(message = "A competência de desconto (YYYY-MM) é obrigatória.")
    private String referenceMonth;

    @NotNull(message = "O valor do débito é obrigatório.")
    @DecimalMin(value = "0.01", message = "O valor do estorno deve ser maior que zero.")
    private BigDecimal debitAmount;
}


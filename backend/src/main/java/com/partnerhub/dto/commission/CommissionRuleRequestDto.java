package com.partnerhub.dto.commission;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionRuleRequestDto {

    @NotBlank(message = "O código identificador da regra é obrigatório.")
    private String ruleCode;

    @NotBlank(message = "O nome da operadora é obrigatório.")
    private String operatorName;

    @NotBlank(message = "O nome do produto/plano é obrigatório.")
    private String productName;

    @NotNull(message = "O percentual de agenciamento é obrigatório.")
    @DecimalMin(value = "0.0", message = "O percentual de agenciamento não pode ser negativo.")
    private BigDecimal agencyPercentage;

    @NotNull(message = "O limite de parcelas de agenciamento é obrigatório.")
    @Min(value = 1, message = "A quantidade de parcelas de agenciamento deve ser de pelo menos 1.")
    private Integer agencyInstallments;

    @NotNull(message = "O percentual de comissão recorrente é obrigatório.")
    @DecimalMin(value = "0.0", message = "O percentual de recorrência não pode ser negativo.")
    private BigDecimal recurringPercentage;

    @NotNull(message = "A data de início de vigência é obrigatória.")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;
}


package com.partnerhub.dto.finance;

import com.partnerhub.domain.enums.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceReviewRequestDto {

    @NotNull(message = "O status de avaliação da NFS-e é obrigatório.")
    private InvoiceStatus status;

    private String reviewNotes;
}


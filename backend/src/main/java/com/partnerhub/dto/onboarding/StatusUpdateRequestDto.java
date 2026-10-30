package com.partnerhub.dto.onboarding;

import com.partnerhub.domain.enums.OnboardingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdateRequestDto {

    @NotNull(message = "O novo status de aprovação é obrigatório.")
    private OnboardingStatus status;

    private String reviewNotes;
}


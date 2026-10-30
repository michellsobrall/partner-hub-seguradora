package com.partnerhub.dto.onboarding;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerStatsDto {
    private long total;
    private long pending;
    private long underReview;
    private long approved;
    private long rejected;
}


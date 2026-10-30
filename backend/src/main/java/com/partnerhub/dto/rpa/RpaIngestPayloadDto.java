package com.partnerhub.dto.rpa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RpaIngestPayloadDto {
    private String sourcePortal;
    private String triggerMode;
    private Integer rawBrokersCount;
    private Integer rawRulesCount;
    private Integer duplicatesRemoved;
    private Long durationMs;
    private List<RpaBrokerItemDto> brokers;
    private List<RpaRuleItemDto> rules;
}


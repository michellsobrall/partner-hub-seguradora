package com.partnerhub.dto.portal;

import com.partnerhub.dto.commission.CommissionEntryDto;
import com.partnerhub.dto.finance.ClawbackResponseDto;
import com.partnerhub.dto.finance.PayoutSettlementDto;
import com.partnerhub.dto.onboarding.BrokerResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerPortalDashboardDto {
    private BrokerResponseDto broker;

    // 4 Métricas Executivas do Corretor
    private BigDecimal earningsInCurrentMonth;
    private BigDecimal projectedNextInvoice;
    private BigDecimal totalPaidInYear;
    private BigDecimal openNetBalance;
    private int totalActiveLives;
    private int totalPoliciesCount;

    // Central de Alertas e Lembretes (ex: NFS-e pendente)
    private List<BrokerAlertDto> alerts;

    // Gráficos de Evolução e Distribuição por Operadora
    private List<MonthlyEvolutionPointDto> monthlyEvolution;
    private List<OperatorShareDto> operatorBreakdown;

    // Extrato Analítico, Fechamentos e Clawbacks do Corretor
    private List<CommissionEntryDto> entries;
    private List<PayoutSettlementDto> settlements;
    private List<ClawbackResponseDto> clawbacks;
}


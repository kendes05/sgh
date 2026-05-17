package com.unifor.br.screening_service.dto;

import java.util.Map;

public record ScreeningStatsResponse(
        long totalHoje,
        Map<String, Long> porStatus,
        Map<String, Long> porPrioridade,
        double tempoMedioEsperaMinutos,
        Map<String, Long> porSetor
) {}

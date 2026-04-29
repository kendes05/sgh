package com.unifor.br.screening_service.dto;

public record QueueMetricsResponse(
        long elapsedMinutes,
        long remainingMinutes,
        int queuePosition) {
}

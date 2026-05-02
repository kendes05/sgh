package com.unifor.br.medical_records_service.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import com.unifor.br.medical_records_service.model.TimelineEventType;

public record TimelineItemResponse(
        UUID id,
        TimelineEventType tipoEvento,
        LocalDateTime dataEvento,
        String titulo,
        String descricao,
        Map<String, Object> detalhes) {
}

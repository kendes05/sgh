package com.unifor.br.medical_records_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record ExamResponse(
        UUID id,
        String tipoExame,
        LocalDate dataRealizacao,
        String resultadoTexto,
        Map<String, Object> resultadoEstruturado,
        LocalDateTime criadoEm) {
}

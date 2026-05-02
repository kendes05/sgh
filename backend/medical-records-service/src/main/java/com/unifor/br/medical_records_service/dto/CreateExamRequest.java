package com.unifor.br.medical_records_service.dto;

import java.time.LocalDate;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateExamRequest(
        @NotBlank(message = "tipoExame e obrigatorio")
        String tipoExame,
        @NotNull(message = "dataRealizacao e obrigatoria")
        LocalDate dataRealizacao,
        String resultadoTexto,
        Map<String, Object> resultadoEstruturado) {
}

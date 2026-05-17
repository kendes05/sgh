package com.unifor.br.patient_service.dto;

public record PatientStatsResponse(
        long totalAtivos,
        long cadastrosNoMes
) {}

package com.unifor.br.medical_records_service.client;

import java.util.UUID;

public record DoctorSummaryResponse(
        UUID id,
        String nome,
        String crm_coren,
        String role,
        String sexo,
        String email,
        String telefone,
        String especialidadePrincipal) {
}

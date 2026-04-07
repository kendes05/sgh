package com.unifor.br.doctor_service.dto;

import lombok.Data;

@Data
public class MedicoUpdateRequest {

    private String especialidade;
    private String telefone;
    private String email;
    // nome e CRM não podem ser alterados livremente
}

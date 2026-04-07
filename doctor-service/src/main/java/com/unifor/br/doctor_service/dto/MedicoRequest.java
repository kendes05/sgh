package com.unifor.br.doctor_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MedicoRequest {

    @NotNull(message = "usuarioId é obrigatório")
    private Long usuarioId;

    @NotBlank(message = "nome é obrigatório")
    private String nome;

    @NotBlank(message = "CRM é obrigatório")
    private String crm;

    @NotBlank(message = "especialidade é obrigatória")
    private String especialidade;

    private String telefone;

    private String email;
}

package com.unifor.br.doctor_service.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MedicoResponse {

    private Long id;
    private Long usuarioId;
    private String nome;
    private String crm;
    private String especialidade;
    private String telefone;
    private String email;
    private Boolean ativo;
    private LocalDateTime criadoEm;
}

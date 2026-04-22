package com.unifor.br.doctor_service.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class DoctorResponse {

    private UUID id;
    private String nome;
    private String crm;
    private String sexo;
    private String email;
    private String telefone;
    private String especialidadePrincipal;
}
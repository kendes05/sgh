package com.unifor.br.doctor_service.dto;

import com.unifor.br.doctor_service.model.Doctor.Role;
import com.unifor.br.doctor_service.model.Doctor.Sexo;
import lombok.Data;

import java.util.UUID;

@Data
public class DoctorResponse {

    private UUID id;
    private String nome;
    private String crmCoren;
    private Role role;
    private Sexo sexo;
    private String email;
    private String telefone;
    private String especialidadePrincipal;
    private Boolean isActive;
}

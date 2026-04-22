package com.unifor.br.doctor_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DoctorRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String nome;

    @NotBlank(message = "CRM é obrigatório")
    private String crm;

    @NotBlank(message = "Sexo é obrigatório")
    private String sexo;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "Telefone é obrigatório")
    @Size(max = 11, message = "Telefone deve ter no máximo 11 caracteres")
    private String telefone;

    @NotBlank(message = "Especialidade principal é obrigatória")
    private String especialidadePrincipal;
}
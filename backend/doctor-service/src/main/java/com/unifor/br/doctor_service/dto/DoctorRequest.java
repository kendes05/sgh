package com.unifor.br.doctor_service.dto;

import com.unifor.br.doctor_service.model.Doctor.Role;
import com.unifor.br.doctor_service.model.Doctor.Sexo;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DoctorRequest {

    @NotBlank(message = "Nome e obrigatorio")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String nome;

    @NotNull(message = "Role e obrigatoria")
    private Role role;

    @NotBlank(message = "CRM/COREN e obrigatorio")
    @Size(max = 20, message = "CRM/COREN deve ter no maximo 20 caracteres")
    private String crmCoren;

    @NotNull(message = "Sexo e obrigatorio")
    private Sexo sexo;

    @NotBlank(message = "Email e obrigatorio")
    @Email(message = "Email invalido")
    private String email;

    @NotBlank(message = "Telefone e obrigatorio")
    @Pattern(
        regexp = "^\\(?\\d{2}\\)?[\\s-]?\\d{4,5}[\\s-]?\\d{4}$",
        message = "Telefone invalido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX"
    )
    private String telefone;

    @NotBlank(message = "Especialidade principal e obrigatoria")
    @Size(max = 100, message = "Especialidade deve ter no maximo 100 caracteres")
    private String especialidadePrincipal;
}

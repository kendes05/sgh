package com.unifor.br.patient_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PatientUpdateRequest(

    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    String nome,

    @Email(message = "E-mail inválido")
    String email,

    @Past(message = "Data de nascimento deve ser no passado")
    LocalDate dataNascimento,

    String genero,

    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    String telefone
) {}
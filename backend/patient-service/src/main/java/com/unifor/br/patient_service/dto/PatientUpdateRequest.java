package com.unifor.br.patient_service.dto;

import java.time.LocalDate;

import com.unifor.br.patient_service.model.Patient.Genero;
import com.unifor.br.patient_service.model.Patient.TipoSanguineo;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientUpdateRequest(

    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    String nome,

    @Email(message = "E-mail invalido")
    String email,

    @Pattern(
        regexp = "\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}",
        message = "CPF invalido. Informe no formato 000.000.000-00 ou apenas os digitos"
    )
    String cpf,

    @Past(message = "Data de nascimento deve ser no passado")
    LocalDate dataNascimento,

    Genero genero,

    TipoSanguineo tipoSanguineo,

    @Size(max = 20, message = "Telefone deve ter no maximo 20 caracteres")
    String telefone,

    @Size(max = 30, message = "Numero do cartao SUS deve ter no maximo 30 caracteres")
    String susCardNumber

) {}

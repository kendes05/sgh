package com.unifor.br.patient_service.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.unifor.br.patient_service.model.Patient.Genero;
import com.unifor.br.patient_service.model.Patient.TipoSanguineo;

public record PatientResponse(
    UUID id,
    String nome,
    String email,
    String cpf,
    LocalDate dataNascimento,
    Genero genero,
    TipoSanguineo tipoSanguineo,
    String telefone,
    String susCardNumber,
    boolean isActive
) {}

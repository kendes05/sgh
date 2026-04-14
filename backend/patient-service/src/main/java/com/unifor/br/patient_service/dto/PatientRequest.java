package com.unifor.br.patient_service.dto;


import java.time.LocalDate;

import lombok.Data;

@Data
public class PatientRequest {
    String nome;
    String email;
    String telefone;
    String genero;
    LocalDate dataNascimento;
}

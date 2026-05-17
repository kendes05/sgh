package com.unifor.br.patient_service.dto;

import java.time.LocalDate;

import com.unifor.br.patient_service.model.Patient.Genero;
import com.unifor.br.patient_service.model.Patient.TipoSanguineo;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PatientRequest {

    @NotBlank(message = "Nome e obrigatorio")
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    private String nome;

    @NotBlank(message = "Email e obrigatorio")
    @Email(message = "Email invalido")
    private String email;

    @NotBlank(message = "CPF e obrigatorio")
    @Pattern(
        regexp = "\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}",
        message = "CPF invalido. Informe no formato 000.000.000-00 ou apenas os digitos"
    )
    private String cpf;

    @NotBlank(message = "Telefone e obrigatorio")
    @Pattern(
        regexp = "^\\(?\\d{2}\\)?[\\s-]?\\d{4,5}[\\s-]?\\d{4}$",
        message = "Telefone invalido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX"
    )
    private String telefone;

    @NotNull(message = "Genero e obrigatorio")
    private Genero genero;

    @NotNull(message = "Tipo sanguineo e obrigatorio")
    private TipoSanguineo tipoSanguineo;

    @Size(max = 30, message = "Numero do cartao SUS deve ter no maximo 30 caracteres")
    private String susCardNumber;

    @NotNull(message = "Data de nascimento e obrigatoria")
    @Past(message = "Data de nascimento deve estar no passado")
    private LocalDate dataNascimento;
}

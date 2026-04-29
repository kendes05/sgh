package com.unifor.br.screening_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SinaisVitais {

    @NotNull
    @Min(30)
    @Max(300)
    @Column(name = "pressao_sistolica")
    private Integer pressaoSistolica;

    @NotNull
    @Min(20)
    @Max(200)
    @Column(name = "pressao_diastolica")
    private Integer pressaoDiastolica;

    @NotNull
    @Min(20)
    @Max(250)
    @Column(name = "frequencia_cardiaca")
    private Integer frequenciaCardiaca;

    @NotNull
    @DecimalMin("25.0")
    @DecimalMax("45.0")
    @Column(name = "temperatura")
    private Double temperatura;

    @NotNull
    @Min(5)
    @Max(80)
    @Column(name = "frequencia_respiratoria")
    private Integer frequenciaRespiratoria;

    @NotNull
    @Min(50)
    @Max(100)
    @Column(name = "saturacao_oxigenio")
    private Integer saturacaoOxigenio;

    @Min(20)
    @Max(600)
    @Column(name = "glicemia")
    private Integer glicemia;

    @NotNull
    @Min(0)
    @Max(10)
    @Column(name = "escala_dor")
    private Integer escalaDor;
}

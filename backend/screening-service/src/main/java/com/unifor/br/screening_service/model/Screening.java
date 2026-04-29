package com.unifor.br.screening_service.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "triagens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Screening {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "paciente_id", nullable = false)
    private UUID patientId;

    @Column(name = "nome_paciente", nullable = false, length = 150)
    private String patientName;

    @Column(name = "data_nascimento", nullable = false)
    private LocalDate patientBirthDate;

    @Column(name = "cartao_sus", length = 30)
    private String susCardNumber;

    @Column(name = "numero_prontuario", length = 40)
    private String medicalRecordNumber;

    @Column(name = "profissional_cadastro_id", nullable = false)
    private UUID triageProfessionalId;

    @Column(name = "profissional_classificacao_id")
    private UUID classificationProfessionalId;

    @Column(name = "profissional_encaminhamento_id")
    private UUID routingProfessionalId;

    @Column(name = "queixa_principal", nullable = false, length = 500)
    private String mainComplaint;

    @ElementCollection(targetClass = StructuredSymptom.class)
    @CollectionTable(name = "triagem_sintomas", joinColumns = @JoinColumn(name = "triagem_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "sintoma", nullable = false, length = 50)
    @Builder.Default
    private List<StructuredSymptom> symptoms = new ArrayList<>();

    @Column(name = "sintomas_complementares", columnDefinition = "TEXT")
    private String complementarySymptoms;

    @ElementCollection
    @CollectionTable(name = "triagem_alergias", joinColumns = @JoinColumn(name = "triagem_id"))
    @Column(name = "alergia", length = 150)
    @Builder.Default
    private List<String> allergies = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "triagem_medicamentos", joinColumns = @JoinColumn(name = "triagem_id"))
    @Column(name = "medicamento", length = 200)
    @Builder.Default
    private List<String> medicationsInUse = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "triagem_comorbidades", joinColumns = @JoinColumn(name = "triagem_id"))
    @Column(name = "comorbidade", length = 150)
    @Builder.Default
    private List<String> comorbidities = new ArrayList<>();

    @Column(name = "observacoes_gerais", columnDefinition = "TEXT")
    private String generalNotes;

    @Embedded
    private SinaisVitais vitalSigns;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private ScreeningStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridade_sugerida", length = 20)
    private PriorityLevel suggestedPriority;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridade_final", length = 20)
    private PriorityLevel finalPriority;

    @Column(name = "score_classificacao")
    private Integer classificationScore;

    @Column(name = "protocolo", length = 100)
    private String protocol;

    @Column(name = "justificativa_sugestao", columnDefinition = "TEXT")
    private String suggestedPriorityReason;

    @Column(name = "justificativa_ajuste", columnDefinition = "TEXT")
    private String overrideJustification;

    @Column(name = "classificada_em")
    private LocalDateTime classifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "setor_destino", length = 50)
    private DestinationSector destinationSector;

    @Column(name = "observacoes_encaminhamento", columnDefinition = "TEXT")
    private String routingNotes;

    @Column(name = "encaminhada_em")
    private LocalDateTime routedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isHighPriority() {
        return finalPriority == PriorityLevel.VERMELHO || finalPriority == PriorityLevel.LARANJA;
    }
}

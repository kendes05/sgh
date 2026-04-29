package com.unifor.br.screening_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.unifor.br.screening_service.dto.ClassificationSuggestionResponse;
import com.unifor.br.screening_service.model.PriorityLevel;
import com.unifor.br.screening_service.model.Screening;
import com.unifor.br.screening_service.model.ScreeningStatus;
import com.unifor.br.screening_service.model.SinaisVitais;
import com.unifor.br.screening_service.model.StructuredSymptom;

class ClassificationEngineTest {

    private final ClassificationEngine classificationEngine = new ClassificationEngine();

    @Test
    void shouldSuggestRedForSevereHypoxia() {
        Screening screening = baseScreening();
        screening.setVitalSigns(new SinaisVitais(120, 80, 110, 36.8, 24, 88, 100, 7));

        ClassificationSuggestionResponse response = classificationEngine.suggest(screening);

        assertEquals(PriorityLevel.VERMELHO, response.suggestedPriority());
        assertTrue(response.reasons().stream().anyMatch(reason -> reason.contains("SpO2")));
    }

    @Test
    void shouldSuggestOrangeForIntensePainAndTrauma() {
        Screening screening = baseScreening();
        screening.setSymptoms(List.of(StructuredSymptom.TRAUMA));
        screening.setMainComplaint("Trauma em membro inferior com dor intensa");
        screening.setVitalSigns(new SinaisVitais(130, 85, 95, 36.7, 18, 97, 90, 9));

        ClassificationSuggestionResponse response = classificationEngine.suggest(screening);

        assertEquals(PriorityLevel.LARANJA, response.suggestedPriority());
        assertTrue(response.reasons().stream().anyMatch(reason -> reason.contains("Dor intensa")));
    }

    private Screening baseScreening() {
        return Screening.builder()
                .id(UUID.randomUUID())
                .patientId(UUID.randomUUID())
                .patientName("Paciente Teste")
                .patientBirthDate(LocalDate.of(1990, 1, 1))
                .triageProfessionalId(UUID.randomUUID())
                .mainComplaint("Dor no peito")
                .symptoms(List.of(StructuredSymptom.DOR_NO_PEITO))
                .status(ScreeningStatus.AGUARDANDO_CLASSIFICACAO)
                .vitalSigns(new SinaisVitais(120, 80, 80, 36.5, 16, 98, 95, 5))
                .build();
    }
}

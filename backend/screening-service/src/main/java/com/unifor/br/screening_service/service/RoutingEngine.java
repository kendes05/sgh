package com.unifor.br.screening_service.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.unifor.br.screening_service.model.DestinationSector;
import com.unifor.br.screening_service.model.PriorityLevel;
import com.unifor.br.screening_service.model.Screening;
import com.unifor.br.screening_service.model.StructuredSymptom;

@Component
public class RoutingEngine {

    public DestinationSector suggest(Screening screening) {
        String searchableText = (screening.getMainComplaint() + " "
                + (screening.getComplementarySymptoms() == null ? "" : screening.getComplementarySymptoms()))
                .toLowerCase(Locale.ROOT);

        if (screening.getFinalPriority() == PriorityLevel.VERMELHO) {
            return DestinationSector.SALA_EMERGENCIA;
        }

        if (screening.getFinalPriority() == PriorityLevel.LARANJA
                && (screening.getSymptoms().contains(StructuredSymptom.DOR_NO_PEITO)
                        || screening.getSymptoms().contains(StructuredSymptom.FALTA_DE_AR)
                        || containsAny(searchableText, "dor no peito", "falta de ar", "dispneia"))) {
            return DestinationSector.SALA_EMERGENCIA;
        }

        if (containsAny(searchableText, "sutura", "laceracao", "ferimento", "corte")
                || screening.getSymptoms().contains(StructuredSymptom.FERIMENTO_COM_CORTE)) {
            return DestinationSector.SALA_SUTURAS;
        }

        if (containsAny(searchableText, "fratura", "entorse", "luxacao", "trauma")
                || screening.getSymptoms().contains(StructuredSymptom.TRAUMA)) {
            return DestinationSector.CONSULTORIO_ORTOPEDICO;
        }

        if (ageInYears(screening.getPatientBirthDate()) < 18
                && screening.getFinalPriority() != PriorityLevel.VERMELHO
                && screening.getFinalPriority() != PriorityLevel.LARANJA) {
            return DestinationSector.CONSULTORIO_PEDIATRICO;
        }

        return DestinationSector.CONSULTORIO_CLINICA_GERAL;
    }

    private boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private int ageInYears(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}

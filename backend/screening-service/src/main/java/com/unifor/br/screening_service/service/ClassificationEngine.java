package com.unifor.br.screening_service.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.unifor.br.screening_service.dto.ClassificationSuggestionResponse;
import com.unifor.br.screening_service.model.PriorityLevel;
import com.unifor.br.screening_service.model.Screening;
import com.unifor.br.screening_service.model.SinaisVitais;
import com.unifor.br.screening_service.model.StructuredSymptom;

@Component
public class ClassificationEngine {

    public ClassificationSuggestionResponse suggest(Screening screening) {
        SinaisVitais vitalSigns = screening.getVitalSigns();
        Set<StructuredSymptom> symptoms = Set.copyOf(screening.getSymptoms());
        String searchableText = searchableText(screening);
        List<String> reasons = new ArrayList<>();

        if (isRed(vitalSigns, symptoms, searchableText)) {
            fillRedReasons(vitalSigns, symptoms, searchableText, reasons);
            return buildResponse(PriorityLevel.VERMELHO, reasons);
        }

        if (isOrange(screening, vitalSigns, symptoms, searchableText)) {
            fillOrangeReasons(screening, vitalSigns, symptoms, searchableText, reasons);
            return buildResponse(PriorityLevel.LARANJA, reasons);
        }

        if (isYellow(vitalSigns, symptoms, searchableText)) {
            fillYellowReasons(vitalSigns, symptoms, searchableText, reasons);
            return buildResponse(PriorityLevel.AMARELO, reasons);
        }

        if (isGreen(vitalSigns, symptoms, searchableText)) {
            fillGreenReasons(vitalSigns, symptoms, searchableText, reasons);
            return buildResponse(PriorityLevel.VERDE, reasons);
        }

        reasons.add("Sintomas leves ou demanda administrativa sem sinais de gravidade imediata.");
        return buildResponse(PriorityLevel.AZUL, reasons);
    }

    private ClassificationSuggestionResponse buildResponse(PriorityLevel level, List<String> reasons) {
        return new ClassificationSuggestionResponse(level, level.getScore(), level.getMaxWaitMinutes(), reasons);
    }

    private boolean isRed(SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms, String searchableText) {
        boolean highBpWithCardiacSymptoms = vitalSigns.getPressaoSistolica() != null
                && vitalSigns.getPressaoDiastolica() != null
                && (vitalSigns.getPressaoSistolica() >= 180 || vitalSigns.getPressaoDiastolica() >= 110)
                && (hasAny(symptoms, StructuredSymptom.DOR_NO_PEITO, StructuredSymptom.PALPITACOES)
                        || containsAny(searchableText, "dor no peito", "dor toracica"));

        boolean severeHypoxia = vitalSigns.getSaturacaoOxigenio() != null && vitalSigns.getSaturacaoOxigenio() < 90;
        boolean criticalComplaint = hasAny(symptoms, StructuredSymptom.CONVULSAO, StructuredSymptom.HEMORRAGIA_ATIVA)
                || containsAny(searchableText, "avc", "parada cardiaca", "choque", "convuls");

        return highBpWithCardiacSymptoms || severeHypoxia || criticalComplaint;
    }

    private void fillRedReasons(SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms, String searchableText,
            List<String> reasons) {
        if (vitalSigns.getSaturacaoOxigenio() != null && vitalSigns.getSaturacaoOxigenio() < 90) {
            reasons.add("SpO2 abaixo de 90%, indicando hipoxia severa.");
        }
        if (vitalSigns.getPressaoSistolica() != null && vitalSigns.getPressaoDiastolica() != null
                && (vitalSigns.getPressaoSistolica() >= 180 || vitalSigns.getPressaoDiastolica() >= 110)
                && (hasAny(symptoms, StructuredSymptom.DOR_NO_PEITO, StructuredSymptom.PALPITACOES)
                        || containsAny(searchableText, "dor no peito", "dor toracica"))) {
            reasons.add("PA critica associada a sintomas cardiacos.");
        }
        if (hasAny(symptoms, StructuredSymptom.CONVULSAO, StructuredSymptom.HEMORRAGIA_ATIVA)
                || containsAny(searchableText, "avc", "parada cardiaca", "choque", "convuls")) {
            reasons.add("Queixa ou sintoma com potencial risco imediato a vida.");
        }
    }

    private boolean isOrange(Screening screening, SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms,
            String searchableText) {
        int ageInMonths = ageInMonths(screening.getPatientBirthDate());
        int ageInYears = ageInYears(screening.getPatientBirthDate());

        boolean feverRisk = vitalSigns.getTemperatura() != null
                && vitalSigns.getTemperatura() > 39.5
                && (ageInMonths < 3 || ageInYears > 65);

        boolean intensePain = vitalSigns.getEscalaDor() != null
                && vitalSigns.getEscalaDor() >= 8
                && (hasAny(symptoms, StructuredSymptom.TRAUMA, StructuredSymptom.DOR_NO_PEITO)
                        || containsAny(searchableText, "trauma", "dor no peito", "fratura"));

        boolean severeRespiratory = hasAny(symptoms, StructuredSymptom.FALTA_DE_AR, StructuredSymptom.CHIADO_NO_PEITO)
                && vitalSigns.getFrequenciaRespiratoria() != null
                && vitalSigns.getFrequenciaRespiratoria() >= 30;

        return feverRisk || intensePain || severeRespiratory;
    }

    private void fillOrangeReasons(Screening screening, SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms,
            String searchableText, List<String> reasons) {
        int ageInMonths = ageInMonths(screening.getPatientBirthDate());
        int ageInYears = ageInYears(screening.getPatientBirthDate());
        if (vitalSigns.getTemperatura() != null
                && vitalSigns.getTemperatura() > 39.5
                && (ageInMonths < 3 || ageInYears > 65)) {
            reasons.add("Febre muito alta em faixa etaria de risco.");
        }
        if (vitalSigns.getEscalaDor() != null
                && vitalSigns.getEscalaDor() >= 8
                && (hasAny(symptoms, StructuredSymptom.TRAUMA, StructuredSymptom.DOR_NO_PEITO)
                        || containsAny(searchableText, "trauma", "dor no peito", "fratura"))) {
            reasons.add("Dor intensa associada a trauma ou dor toracica.");
        }
        if (hasAny(symptoms, StructuredSymptom.FALTA_DE_AR, StructuredSymptom.CHIADO_NO_PEITO)
                && vitalSigns.getFrequenciaRespiratoria() != null
                && vitalSigns.getFrequenciaRespiratoria() >= 30) {
            reasons.add("Desconforto respiratorio com frequencia respiratoria elevada.");
        }
    }

    private boolean isYellow(SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms, String searchableText) {
        boolean dehydrationRisk = hasAny(symptoms, StructuredSymptom.VOMITO_PERSISTENTE, StructuredSymptom.SINAIS_DESIDRATACAO)
                || containsAny(searchableText, "vomito persistente", "desidrat");

        boolean abnormalCardiac = vitalSigns.getFrequenciaCardiaca() != null
                && (vitalSigns.getFrequenciaCardiaca() > 120 || vitalSigns.getFrequenciaCardiaca() < 50);

        boolean highFever = vitalSigns.getTemperatura() != null && vitalSigns.getTemperatura() >= 39.0;

        return dehydrationRisk || abnormalCardiac || highFever;
    }

    private void fillYellowReasons(SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms, String searchableText,
            List<String> reasons) {
        if (hasAny(symptoms, StructuredSymptom.VOMITO_PERSISTENTE, StructuredSymptom.SINAIS_DESIDRATACAO)
                || containsAny(searchableText, "vomito persistente", "desidrat")) {
            reasons.add("Vomito persistente ou sinais de desidratacao.");
        }
        if (vitalSigns.getFrequenciaCardiaca() != null
                && (vitalSigns.getFrequenciaCardiaca() > 120 || vitalSigns.getFrequenciaCardiaca() < 50)) {
            reasons.add("Frequencia cardiaca com alteracao importante.");
        }
        if (vitalSigns.getTemperatura() != null && vitalSigns.getTemperatura() >= 39.0) {
            reasons.add("Febre alta com necessidade de avaliacao prioritaria.");
        }
    }

    private boolean isGreen(SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms, String searchableText) {
        boolean minorTrauma = hasAny(symptoms, StructuredSymptom.TRAUMA)
                && (vitalSigns.getEscalaDor() == null || vitalSigns.getEscalaDor() < 8);
        boolean mildSymptoms = containsAny(searchableText, "febre baixa", "tosse", "cefaleia", "entorse")
                || hasAny(symptoms, StructuredSymptom.TOSSE, StructuredSymptom.CEFALEIA, StructuredSymptom.DIARREIA);
        return minorTrauma || mildSymptoms;
    }

    private void fillGreenReasons(SinaisVitais vitalSigns, Set<StructuredSymptom> symptoms, String searchableText,
            List<String> reasons) {
        if (hasAny(symptoms, StructuredSymptom.TRAUMA)
                && (vitalSigns.getEscalaDor() == null || vitalSigns.getEscalaDor() < 8)) {
            reasons.add("Trauma sem criterio de gravidade imediata.");
        }
        if (containsAny(searchableText, "febre baixa", "tosse", "cefaleia", "entorse")
                || hasAny(symptoms, StructuredSymptom.TOSSE, StructuredSymptom.CEFALEIA, StructuredSymptom.DIARREIA)) {
            reasons.add("Quadro leve com possibilidade de espera monitorada.");
        }
    }

    private String searchableText(Screening screening) {
        String complementary = screening.getComplementarySymptoms() == null ? "" : screening.getComplementarySymptoms();
        return (screening.getMainComplaint() + " " + complementary).toLowerCase(Locale.ROOT);
    }

    private boolean hasAny(Set<StructuredSymptom> symptoms, StructuredSymptom... expected) {
        for (StructuredSymptom symptom : expected) {
            if (symptoms.contains(symptom)) {
                return true;
            }
        }
        return false;
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

    private int ageInMonths(LocalDate birthDate) {
        Period period = Period.between(birthDate, LocalDate.now());
        return period.getYears() * 12 + period.getMonths();
    }
}

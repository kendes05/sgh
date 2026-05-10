package com.unifor.br.screening_service.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.unifor.br.screening_service.model.Screening;

@Component
public class ScreeningEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String createdTopic;
    private final String classifiedTopic;
    private final String criticalTopic;
    private final String attendanceTopic;
    private final String finishedTopic;

    public ScreeningEventPublisher(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${app.kafka.topics.screening-created:triagem.criada}") String createdTopic,
            @Value("${app.kafka.topics.screening-classified:triagem.classificada}") String classifiedTopic,
            @Value("${app.kafka.topics.screening-critical:triagem.critica}") String criticalTopic,
            @Value("${app.kafka.topics.screening-attendance:triagem.em_atendimento}") String attendanceTopic,
            @Value("${app.kafka.topics.screening-finished:triagem.finalizada}") String finishedTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.createdTopic = createdTopic;
        this.classifiedTopic = classifiedTopic;
        this.criticalTopic = criticalTopic;
        this.attendanceTopic = attendanceTopic;
        this.finishedTopic = finishedTopic;
    }

    public void publishCreated(Screening screening) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("idTriagem", screening.getId());
        data.put("idPaciente", screening.getPatientId());
        data.put("queixaPrincipal", screening.getMainComplaint());
        data.put("setorDestino", screening.getDestinationSector());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("evento", "triagem.criada");
        payload.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        payload.put("dados", data);
        kafkaTemplate.send(createdTopic, screening.getId().toString(), payload);
    }

    public void publishClassified(Screening screening) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("evento", "triagem.classificada");
        payload.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        payload.put("dados", Map.of(
                "idTriagem", screening.getId(),
                "prioridade", screening.getFinalPriority(),
                "score", screening.getClassificationScore(),
                "setorDestino", screening.getDestinationSector(),
                "tempoMaximoEspera", screening.getFinalPriority().getMaxWaitMinutes()));
        kafkaTemplate.send(classifiedTopic, screening.getId().toString(), payload);
    }

    public void publishAttendanceStarted(Screening screening) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("evento", "triagem.em_atendimento");
        payload.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        payload.put("dados", Map.of(
                "idTriagem", screening.getId(),
                "idPaciente", screening.getPatientId(),
                "idProfissionalAtendimento", screening.getAttendingProfessionalId(),
                "setorDestino", screening.getDestinationSector()));
        kafkaTemplate.send(attendanceTopic, screening.getId().toString(), payload);
    }

    public void publishFinished(Screening screening) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("evento", "triagem.finalizada");
        payload.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        payload.put("dados", Map.of(
                "idTriagem", screening.getId(),
                "idPaciente", screening.getPatientId(),
                "prioridade", screening.getFinalPriority(),
                "setorDestino", screening.getDestinationSector(),
                "finalizadaEm", screening.getFinishedAt().toString()));
        kafkaTemplate.send(finishedTopic, screening.getId().toString(), payload);
    }

    public void publishCritical(Screening screening) {
        Map<String, Object> vitalSigns = new LinkedHashMap<>();
        vitalSigns.put("PA", screening.getVitalSigns().getPressaoSistolica() + "/"
                + screening.getVitalSigns().getPressaoDiastolica());
        vitalSigns.put("FC", screening.getVitalSigns().getFrequenciaCardiaca());
        vitalSigns.put("SpO2", screening.getVitalSigns().getSaturacaoOxigenio());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("idTriagem", screening.getId());
        data.put("idPaciente", screening.getPatientId());
        data.put("prioridade", screening.getFinalPriority());
        data.put("queixaPrincipal", screening.getMainComplaint());
        data.put("sinaisVitais", vitalSigns);
        data.put("setorDestino", screening.getDestinationSector());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("evento", "triagem.critica");
        payload.put("prioridade", "ALTA");
        payload.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        payload.put("dados", data);
        kafkaTemplate.send(criticalTopic, screening.getId().toString(), payload);
    }
}

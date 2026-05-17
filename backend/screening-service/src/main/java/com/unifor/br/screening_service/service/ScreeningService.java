package com.unifor.br.screening_service.service;

import java.util.ArrayList;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unifor.br.screening_service.client.PatientClient;
import com.unifor.br.screening_service.client.PatientSummaryResponse;
import com.unifor.br.screening_service.dto.CancelScreeningRequest;
import com.unifor.br.screening_service.dto.ClassificationSuggestionResponse;
import com.unifor.br.screening_service.dto.CreateScreeningRequest;
import com.unifor.br.screening_service.dto.FinishScreeningRequest;
import com.unifor.br.screening_service.dto.QueueItemResponse;
import com.unifor.br.screening_service.dto.QueueMetricsResponse;
import com.unifor.br.screening_service.dto.RouteScreeningRequest;
import com.unifor.br.screening_service.dto.ScreeningResponse;
import com.unifor.br.screening_service.dto.ScreeningStatsResponse;
import com.unifor.br.screening_service.dto.StartAttendanceRequest;
import com.unifor.br.screening_service.dto.ValidateClassificationRequest;
import com.unifor.br.screening_service.exception.BusinessException;
import com.unifor.br.screening_service.exception.ResourceNotFoundException;
import com.unifor.br.screening_service.model.DestinationSector;
import com.unifor.br.screening_service.model.PriorityLevel;
import com.unifor.br.screening_service.model.Screening;
import com.unifor.br.screening_service.model.ScreeningStatus;
import com.unifor.br.screening_service.repository.ScreeningRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScreeningService {

    private static final EnumSet<ScreeningStatus> ACTIVE_STATUSES = EnumSet.of(
            ScreeningStatus.AGUARDANDO_CLASSIFICACAO,
            ScreeningStatus.CLASSIFICADA,
            ScreeningStatus.AGUARDANDO_ATENDIMENTO,
            ScreeningStatus.EM_ATENDIMENTO);

    private static final EnumSet<ScreeningStatus> TERMINAL_STATUSES = EnumSet.of(
            ScreeningStatus.FINALIZADA,
            ScreeningStatus.CANCELADA,
            ScreeningStatus.AUSENTE);

    /** Status visíveis na fila de atendimento (dashboard operacional). */
    private static final EnumSet<ScreeningStatus> QUEUE_STATUSES = EnumSet.of(
            ScreeningStatus.AGUARDANDO_ATENDIMENTO,
            ScreeningStatus.EM_ATENDIMENTO);

    private final ScreeningRepository repository;
    private final ClassificationEngine classificationEngine;
    private final RoutingEngine routingEngine;
    private final ScreeningEventPublisher eventPublisher;
    private final PatientClient patientClient;

    @Transactional
    public ScreeningResponse create(CreateScreeningRequest request) {
        // Valida existência e status do paciente no patient-service antes de abrir triagem
        PatientSummaryResponse patient;
        try {
            patient = patientClient.findById(request.patientId());
        } catch (feign.FeignException.NotFound ex) {
            throw new ResourceNotFoundException("Paciente nao encontrado no sistema.");
        } catch (feign.FeignException ex) {
            throw new BusinessException("Erro ao consultar o patient-service: " + ex.status());
        }

        if (!patient.isActive()) {
            throw new BusinessException("Paciente esta inativo e nao pode ser triado.");
        }

        validateNoActiveScreening(request.patientId());

        Screening screening = Screening.builder()
                .patientId(request.patientId())
                .patientName(request.patientName())
                .patientBirthDate(request.patientBirthDate())
                .susCardNumber(request.susCardNumber())
                .medicalRecordNumber(request.medicalRecordNumber())
                .triageProfessionalId(request.triageProfessionalId())
                .mainComplaint(request.mainComplaint())
                .symptoms(defaultList(request.symptoms()))
                .complementarySymptoms(request.complementarySymptoms())
                .allergies(defaultList(request.allergies()))
                .medicationsInUse(defaultList(request.medicationsInUse()))
                .comorbidities(defaultList(request.comorbidities()))
                .generalNotes(request.generalNotes())
                .vitalSigns(request.vitalSigns())
                .status(ScreeningStatus.AGUARDANDO_CLASSIFICACAO)
                .protocol("Manchester Adaptado")
                .build();

        Screening saved = repository.saveAndFlush(screening);
        eventPublisher.publishCreated(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ClassificationSuggestionResponse suggestClassification(UUID screeningId) {
        Screening screening = getEntity(screeningId);
        return classificationEngine.suggest(screening);
    }

    @Transactional
    public ScreeningResponse validateClassification(UUID screeningId, ValidateClassificationRequest request) {
        Screening screening = getEntity(screeningId);
        if (screening.getStatus() != ScreeningStatus.AGUARDANDO_CLASSIFICACAO) {
            throw new BusinessException("Triagem nao esta aguardando classificacao.");
        }

        ClassificationSuggestionResponse suggestion = classificationEngine.suggest(screening);
        PriorityLevel finalPriority = request.finalPriority() != null ? request.finalPriority() : suggestion.suggestedPriority();

        if (finalPriority != suggestion.suggestedPriority()
                && (request.overrideJustification() == null || request.overrideJustification().isBlank())) {
            throw new BusinessException("Justificativa obrigatoria ao alterar a classificacao sugerida.");
        }

        screening.setSuggestedPriority(suggestion.suggestedPriority());
        screening.setSuggestedPriorityReason(String.join(" ", suggestion.reasons()));
        screening.setFinalPriority(finalPriority);
        screening.setClassificationScore(finalPriority.getScore());
        screening.setClassificationProfessionalId(request.professionalId());
        screening.setOverrideJustification(blankToNull(request.overrideJustification()));
        screening.setClassifiedAt(LocalDateTime.now());
        screening.setStatus(ScreeningStatus.CLASSIFICADA);

        return toResponse(repository.save(screening));
    }

    @Transactional
    public ScreeningResponse route(UUID screeningId, RouteScreeningRequest request) {
        Screening screening = getEntity(screeningId);
        if (screening.getStatus() != ScreeningStatus.CLASSIFICADA) {
            throw new BusinessException("Triagem precisa estar classificada antes do encaminhamento.");
        }
        if (screening.getFinalPriority() == null) {
            throw new BusinessException("Triagem sem prioridade final definida.");
        }

        DestinationSector sector = request.destinationSector() != null
                ? request.destinationSector()
                : routingEngine.suggest(screening);

        screening.setDestinationSector(sector);
        screening.setRoutingNotes(blankToNull(request.routingNotes()));
        screening.setRoutingProfessionalId(request.professionalId());
        screening.setRoutedAt(LocalDateTime.now());
        screening.setStatus(ScreeningStatus.AGUARDANDO_ATENDIMENTO);

        Screening saved = repository.save(screening);
        eventPublisher.publishClassified(saved);
        if (saved.isHighPriority()) {
            eventPublisher.publishCritical(saved);
        }
        return toResponse(saved);
    }

    @Transactional
    public ScreeningResponse startAttendance(UUID screeningId, StartAttendanceRequest request) {
        Screening screening = getEntity(screeningId);
        if (screening.getStatus() != ScreeningStatus.AGUARDANDO_ATENDIMENTO) {
            throw new BusinessException("Triagem precisa estar aguardando atendimento para iniciar o atendimento.");
        }

        screening.setAttendingProfessionalId(request.professionalId());
        screening.setStartedAt(LocalDateTime.now());
        screening.setStatus(ScreeningStatus.EM_ATENDIMENTO);

        Screening saved = repository.save(screening);
        eventPublisher.publishAttendanceStarted(saved);
        return toResponse(saved);
    }

    @Transactional
    public ScreeningResponse finishScreening(UUID screeningId, FinishScreeningRequest request) {
        Screening screening = getEntity(screeningId);
        if (screening.getStatus() != ScreeningStatus.EM_ATENDIMENTO) {
            throw new BusinessException("Triagem precisa estar em atendimento para ser finalizada.");
        }

        screening.setDischargeNotes(blankToNull(request.dischargeNotes()));
        screening.setFinishedAt(LocalDateTime.now());
        screening.setStatus(ScreeningStatus.FINALIZADA);

        Screening saved = repository.save(screening);
        eventPublisher.publishFinished(saved);
        return toResponse(saved);
    }

    @Transactional
    public ScreeningResponse cancelScreening(UUID screeningId, CancelScreeningRequest request) {
        Screening screening = getEntity(screeningId);
        if (TERMINAL_STATUSES.contains(screening.getStatus())) {
            throw new BusinessException("Triagem ja esta em estado terminal e nao pode ser cancelada.");
        }

        screening.setCancellationReason(request.reason());
        screening.setFinishedAt(LocalDateTime.now());
        screening.setStatus(request.absent() ? ScreeningStatus.AUSENTE : ScreeningStatus.CANCELADA);

        return toResponse(repository.save(screening));
    }

    @Transactional(readOnly = true)
    public ScreeningResponse findById(UUID screeningId) {
        return toResponse(getEntity(screeningId));
    }

    @Transactional(readOnly = true)
    public List<ScreeningResponse> list(ScreeningStatus status, UUID patientId) {
        List<Screening> screenings;
        if (patientId != null) {
            screenings = repository.findByPatientIdOrderByCreatedAtDesc(patientId);
        } else if (status != null) {
            screenings = repository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            screenings = repository.findAll().stream()
                    .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                    .toList();
        }
        return screenings.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ScreeningResponse findActiveByPatient(UUID patientId) {
        Screening screening = repository.findFirstByPatientIdAndStatusInOrderByCreatedAtDesc(patientId, ACTIVE_STATUSES)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente nao possui triagem ativa."));
        return toResponse(screening);
    }

    /**
     * Retorna a fila de atendimento ordenada por prioridade + tempo de espera.
     * Inclui triagens com status AGUARDANDO_ATENDIMENTO e EM_ATENDIMENTO.
     *
     * @param sector filtra pelo setor de destino; null retorna todos os setores.
     */
    @Transactional(readOnly = true)
    public List<QueueItemResponse> getQueue(DestinationSector sector) {
        List<Screening> raw = sector != null
                ? repository.findByDestinationSectorAndStatusIn(sector, QUEUE_STATUSES)
                : repository.findByStatusIn(QUEUE_STATUSES);

        // Descarta entradas sem prioridade final (dados inconsistentes)
        List<Screening> eligible = raw.stream()
                .filter(s -> s.getFinalPriority() != null && s.getClassifiedAt() != null)
                .toList();

        // Ordena: prioridade DESC (score maior = mais urgente), depois classifiedAt ASC
        List<Screening> sorted = eligible.stream()
                .sorted((a, b) -> {
                    int cmp = Integer.compare(
                            b.getFinalPriority().getScore(),
                            a.getFinalPriority().getScore());
                    if (cmp != 0) return cmp;
                    return a.getClassifiedAt().compareTo(b.getClassifiedAt());
                })
                .toList();

        LocalDateTime now = LocalDateTime.now();
        List<QueueItemResponse> result = new ArrayList<>();

        for (int i = 0; i < sorted.size(); i++) {
            Screening s = sorted.get(i);
            long elapsed   = Duration.between(s.getClassifiedAt(), now).toMinutes();
            long remaining = Math.max(0, s.getFinalPriority().getMaxWaitMinutes() - elapsed);

            result.add(new QueueItemResponse(
                    s.getId(),
                    s.getPatientId(),
                    s.getPatientName(),
                    s.getFinalPriority(),
                    s.getFinalPriority().getScore(),
                    s.getFinalPriority().getMaxWaitMinutes(),
                    s.getDestinationSector(),
                    s.getStatus(),
                    elapsed,
                    remaining,
                    i + 1,                  // posição 1-based
                    s.getClassifiedAt(),
                    s.getStartedAt()));
        }

        return result;
    }

    private void validateNoActiveScreening(UUID patientId) {
        if (repository.existsByPatientIdAndStatusIn(patientId, ACTIVE_STATUSES)) {
            throw new BusinessException("Paciente ja possui triagem ativa.");
        }
    }

    private Screening getEntity(UUID screeningId) {
        return repository.findById(screeningId)
                .orElseThrow(() -> new ResourceNotFoundException("Triagem nao encontrada."));
    }

    private ScreeningResponse toResponse(Screening screening) {
        // Tempo total no fluxo: para estados terminais usa finishedAt, senão usa agora
        LocalDateTime endReference = TERMINAL_STATUSES.contains(screening.getStatus()) && screening.getFinishedAt() != null
                ? screening.getFinishedAt()
                : LocalDateTime.now();
        LocalDateTime createdAtRef = screening.getCreatedAt() != null ? screening.getCreatedAt() : endReference;
        long waitingTimeMinutes = Duration.between(createdAtRef, endReference).toMinutes();

        return new ScreeningResponse(
                screening.getId(),
                screening.getPatientId(),
                screening.getPatientName(),
                screening.getPatientBirthDate(),
                screening.getSusCardNumber(),
                screening.getMedicalRecordNumber(),
                screening.getTriageProfessionalId(),
                screening.getClassificationProfessionalId(),
                screening.getRoutingProfessionalId(),
                screening.getMainComplaint(),
                screening.getSymptoms(),
                screening.getComplementarySymptoms(),
                screening.getAllergies(),
                screening.getMedicationsInUse(),
                screening.getComorbidities(),
                screening.getGeneralNotes(),
                screening.getVitalSigns(),
                screening.getStatus(),
                screening.getSuggestedPriority(),
                screening.getFinalPriority(),
                screening.getClassificationScore(),
                screening.getProtocol(),
                screening.getSuggestedPriorityReason(),
                screening.getOverrideJustification(),
                screening.getClassifiedAt(),
                screening.getDestinationSector(),
                screening.getRoutingNotes(),
                screening.getRoutedAt(),
                screening.getAttendingProfessionalId(),
                screening.getStartedAt(),
                screening.getFinishedAt(),
                screening.getDischargeNotes(),
                screening.getCancellationReason(),
                screening.getCreatedAt(),
                screening.getUpdatedAt(),
                waitingTimeMinutes,
                buildQueueMetrics(screening));
    }

    private QueueMetricsResponse buildQueueMetrics(Screening screening) {
        if ((screening.getStatus() != ScreeningStatus.AGUARDANDO_ATENDIMENTO
                && screening.getStatus() != ScreeningStatus.EM_ATENDIMENTO)
                || screening.getDestinationSector() == null
                || screening.getClassifiedAt() == null
                || screening.getFinalPriority() == null) {
            return null;
        }

        List<Screening> queue = repository.findByDestinationSectorAndStatus(
                screening.getDestinationSector(),
                ScreeningStatus.AGUARDANDO_ATENDIMENTO);

        queue = queue.stream()
                .sorted((left, right) -> {
                    int priorityComparison = Integer.compare(
                            right.getFinalPriority().getScore(),
                            left.getFinalPriority().getScore());
                    if (priorityComparison != 0) {
                        return priorityComparison;
                    }
                    LocalDateTime leftReference = left.getClassifiedAt() != null ? left.getClassifiedAt() : left.getCreatedAt();
                    LocalDateTime rightReference = right.getClassifiedAt() != null ? right.getClassifiedAt() : right.getCreatedAt();
                    return leftReference.compareTo(rightReference);
                })
                .toList();

        int position = 1;
        for (Screening item : queue) {
            if (item.getId().equals(screening.getId())) {
                break;
            }
            position++;
        }

        long elapsed = Duration.between(screening.getClassifiedAt(), LocalDateTime.now()).toMinutes();
        long remaining = Math.max(0, screening.getFinalPriority().getMaxWaitMinutes() - elapsed);
        return new QueueMetricsResponse(elapsed, remaining, position);
    }

    @Transactional(readOnly = true)
    public ScreeningStatsResponse getStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);

        List<Screening> hoje = repository.findByCreatedAtBetween(startOfDay, endOfDay);

        // Contagem por status
        Map<String, Long> porStatus = new LinkedHashMap<>();
        for (ScreeningStatus s : ScreeningStatus.values()) {
            porStatus.put(s.name(), 0L);
        }
        hoje.stream()
                .collect(Collectors.groupingBy(sc -> sc.getStatus().name(), Collectors.counting()))
                .forEach(porStatus::put);

        // Contagem por prioridade (considera finalPriority; cai para suggestedPriority se não classificado)
        Map<String, Long> porPrioridade = new LinkedHashMap<>();
        for (PriorityLevel p : PriorityLevel.values()) {
            porPrioridade.put(p.name(), 0L);
        }
        hoje.stream()
                .filter(sc -> sc.getFinalPriority() != null || sc.getSuggestedPriority() != null)
                .collect(Collectors.groupingBy(
                        sc -> (sc.getFinalPriority() != null ? sc.getFinalPriority() : sc.getSuggestedPriority()).name(),
                        Collectors.counting()))
                .forEach(porPrioridade::put);

        // Contagem por setor de destino
        Map<String, Long> porSetor = new LinkedHashMap<>();
        for (DestinationSector d : DestinationSector.values()) {
            porSetor.put(d.name(), 0L);
        }
        hoje.stream()
                .filter(sc -> sc.getDestinationSector() != null)
                .collect(Collectors.groupingBy(sc -> sc.getDestinationSector().name(), Collectors.counting()))
                .forEach(porSetor::put);

        // Tempo médio de espera em minutos
        LocalDateTime now = LocalDateTime.now();
        double tempoMedio = hoje.stream()
                .mapToLong(sc -> {
                    LocalDateTime ref = TERMINAL_STATUSES.contains(sc.getStatus()) && sc.getFinishedAt() != null
                            ? sc.getFinishedAt()
                            : now;
                    LocalDateTime base = sc.getCreatedAt() != null ? sc.getCreatedAt() : ref;
                    return Duration.between(base, ref).toMinutes();
                })
                .average()
                .orElse(0.0);

        return new ScreeningStatsResponse(hoje.size(), porStatus, porPrioridade, tempoMedio, porSetor);
    }

    private <T> List<T> defaultList(List<T> value) {
        return value == null ? new ArrayList<>() : new ArrayList<>(value);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}

package com.unifor.br.screening_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.unifor.br.screening_service.dto.RouteScreeningRequest;
import com.unifor.br.screening_service.dto.ScreeningResponse;
import com.unifor.br.screening_service.dto.ValidateClassificationRequest;
import com.unifor.br.screening_service.exception.BusinessException;
import com.unifor.br.screening_service.model.DestinationSector;
import com.unifor.br.screening_service.model.PriorityLevel;
import com.unifor.br.screening_service.model.Screening;
import com.unifor.br.screening_service.model.ScreeningStatus;
import com.unifor.br.screening_service.model.SinaisVitais;
import com.unifor.br.screening_service.model.StructuredSymptom;
import com.unifor.br.screening_service.repository.ScreeningRepository;

@ExtendWith(MockitoExtension.class)
class ScreeningServiceTest {

    @Mock
    private ScreeningRepository repository;

    @Mock
    private ScreeningEventPublisher eventPublisher;

    private ScreeningService screeningService;

    @BeforeEach
    void setUp() {
        screeningService = new ScreeningService(
                repository,
                new ClassificationEngine(),
                new RoutingEngine(),
                eventPublisher);
    }

    @Test
    void shouldRequireJustificationWhenPriorityIsOverridden() {
        Screening screening = pendingScreening();
        when(repository.findById(screening.getId())).thenReturn(Optional.of(screening));

        ValidateClassificationRequest request = new ValidateClassificationRequest(
                UUID.randomUUID(),
                PriorityLevel.AZUL,
                null);

        assertThrows(BusinessException.class, () -> screeningService.validateClassification(screening.getId(), request));
    }

    @Test
    void shouldPublishCriticalEventForHighPriorityRouting() {
        Screening screening = pendingScreening();
        screening.setStatus(ScreeningStatus.CLASSIFICADA);
        screening.setFinalPriority(PriorityLevel.VERMELHO);
        screening.setClassificationScore(PriorityLevel.VERMELHO.getScore());
        screening.setClassifiedAt(LocalDateTime.now().minusMinutes(2));

        when(repository.findById(screening.getId())).thenReturn(Optional.of(screening));
        when(repository.save(any(Screening.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.findByDestinationSectorAndStatus(
                DestinationSector.SALA_EMERGENCIA,
                ScreeningStatus.AGUARDANDO_ATENDIMENTO)).thenReturn(List.of(screening));

        ScreeningResponse response = screeningService.route(screening.getId(), new RouteScreeningRequest(
                UUID.randomUUID(),
                null,
                "Levar direto para a sala de emergencia"));

        assertEquals(ScreeningStatus.AGUARDANDO_ATENDIMENTO, response.status());
        assertEquals(DestinationSector.SALA_EMERGENCIA, response.destinationSector());
        verify(eventPublisher).publishClassified(any(Screening.class));
        verify(eventPublisher).publishCritical(any(Screening.class));
    }

    @Test
    void shouldNotPublishCriticalEventForLowPriorityRouting() {
        Screening screening = pendingScreening();
        screening.setStatus(ScreeningStatus.CLASSIFICADA);
        screening.setFinalPriority(PriorityLevel.VERDE);
        screening.setClassificationScore(PriorityLevel.VERDE.getScore());
        screening.setClassifiedAt(LocalDateTime.now().minusMinutes(5));

        when(repository.findById(screening.getId())).thenReturn(Optional.of(screening));
        when(repository.save(any(Screening.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.findByDestinationSectorAndStatus(
                DestinationSector.CONSULTORIO_ORTOPEDICO,
                ScreeningStatus.AGUARDANDO_ATENDIMENTO)).thenReturn(List.of(screening));

        ScreeningResponse response = screeningService.route(screening.getId(), new RouteScreeningRequest(
                UUID.randomUUID(),
                null,
                null));

        assertEquals(DestinationSector.CONSULTORIO_ORTOPEDICO, response.destinationSector());
        verify(eventPublisher).publishClassified(any(Screening.class));
        verify(eventPublisher, never()).publishCritical(any(Screening.class));
    }

    private Screening pendingScreening() {
        return Screening.builder()
                .id(UUID.randomUUID())
                .patientId(UUID.randomUUID())
                .patientName("Maria Silva")
                .patientBirthDate(LocalDate.of(1998, 3, 20))
                .triageProfessionalId(UUID.randomUUID())
                .mainComplaint("Trauma em perna direita")
                .symptoms(List.of(StructuredSymptom.TRAUMA))
                .vitalSigns(new SinaisVitais(120, 80, 88, 36.5, 16, 98, 100, 6))
                .status(ScreeningStatus.AGUARDANDO_CLASSIFICACAO)
                .protocol("Manchester Adaptado")
                .createdAt(LocalDateTime.now().minusMinutes(10))
                .build();
    }
}

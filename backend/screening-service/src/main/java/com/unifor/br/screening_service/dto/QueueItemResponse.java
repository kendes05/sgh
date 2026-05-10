package com.unifor.br.screening_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.unifor.br.screening_service.model.DestinationSector;
import com.unifor.br.screening_service.model.PriorityLevel;
import com.unifor.br.screening_service.model.ScreeningStatus;

/**
 * Visão leve de uma triagem na fila de atendimento.
 * Retornada pelos endpoints GET /screenings/queue e /queue/sector/{sector}.
 */
public record QueueItemResponse(

        UUID id,
        UUID patientId,
        String patientName,

        PriorityLevel priority,
        int priorityScore,
        int maxWaitMinutes,

        DestinationSector sector,
        ScreeningStatus status,

        /** Minutos decorridos desde classifiedAt. */
        long elapsedMinutes,
        /** Minutos restantes até o prazo máximo de espera (min 0). */
        long remainingMinutes,
        /** Posição 1-based na fila ordenada por prioridade + tempo. */
        int queuePosition,

        LocalDateTime classifiedAt,
        /** Preenchido apenas quando status == EM_ATENDIMENTO. */
        LocalDateTime startedAt) {
}

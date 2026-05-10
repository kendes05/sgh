package com.unifor.br.screening_service.model;

public enum ScreeningStatus {
    // Estados ativos (paciente ainda está no fluxo)
    AGUARDANDO_CLASSIFICACAO,
    CLASSIFICADA,
    AGUARDANDO_ATENDIMENTO,
    EM_ATENDIMENTO,

    // Estados terminais
    FINALIZADA,
    CANCELADA,
    AUSENTE
}

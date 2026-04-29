package com.unifor.br.screening_service.model;

public enum PriorityLevel {
    VERMELHO(5, 0, "Emergencia"),
    LARANJA(4, 10, "Muito Urgente"),
    AMARELO(3, 60, "Urgente"),
    VERDE(2, 120, "Pouco Urgente"),
    AZUL(1, 240, "Nao Urgente");

    private final int score;
    private final int maxWaitMinutes;
    private final String label;

    PriorityLevel(int score, int maxWaitMinutes, String label) {
        this.score = score;
        this.maxWaitMinutes = maxWaitMinutes;
        this.label = label;
    }

    public int getScore() {
        return score;
    }

    public int getMaxWaitMinutes() {
        return maxWaitMinutes;
    }

    public String getLabel() {
        return label;
    }
}

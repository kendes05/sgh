package com.unifor.br.screening_service.dto;

import java.util.List;

import com.unifor.br.screening_service.model.PriorityLevel;

public record ClassificationSuggestionResponse(
        PriorityLevel suggestedPriority,
        int score,
        int maxWaitMinutes,
        List<String> reasons) {
}

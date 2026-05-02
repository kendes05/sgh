package com.unifor.br.medical_records_service.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamEntry {

    private UUID id;
    private String examType;
    private LocalDate examDate;
    private String resultText;
    @Builder.Default
    private Map<String, Object> resultData = new LinkedHashMap<>();
    private LocalDateTime createdAt;
}

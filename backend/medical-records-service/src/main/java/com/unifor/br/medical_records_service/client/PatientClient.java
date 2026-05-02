package com.unifor.br.medical_records_service.client;

import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "patient-service", url = "${PATIENT_SERVICE_URL}")
public interface PatientClient {

    @GetMapping("/patients/{id}")
    PatientSummaryResponse findById(@PathVariable UUID id);
}

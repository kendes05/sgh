package com.unifor.br.medical_records_service.client;

import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "doctor-service", url = "${DOCTOR_SERVICE_URL}")
public interface DoctorClient {

    @GetMapping("/doctor/{id}")
    DoctorSummaryResponse findById(@PathVariable UUID id);
}

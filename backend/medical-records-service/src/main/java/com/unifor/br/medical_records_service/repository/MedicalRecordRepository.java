package com.unifor.br.medical_records_service.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.unifor.br.medical_records_service.model.MedicalRecord;

public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, String> {

    boolean existsByPatientId(UUID patientId);

    Optional<MedicalRecord> findByPatientId(UUID patientId);
}

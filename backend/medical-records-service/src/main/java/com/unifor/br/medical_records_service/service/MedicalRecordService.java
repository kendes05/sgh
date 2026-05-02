package com.unifor.br.medical_records_service.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.unifor.br.medical_records_service.client.DoctorClient;
import com.unifor.br.medical_records_service.client.DoctorSummaryResponse;
import com.unifor.br.medical_records_service.client.PatientClient;
import com.unifor.br.medical_records_service.client.PatientSummaryResponse;
import com.unifor.br.medical_records_service.dto.AppointmentResponse;
import com.unifor.br.medical_records_service.dto.CreateAppointmentRequest;
import com.unifor.br.medical_records_service.dto.CreateExamRequest;
import com.unifor.br.medical_records_service.dto.CreateMedicalRecordRequest;
import com.unifor.br.medical_records_service.dto.CreateMedicationRequest;
import com.unifor.br.medical_records_service.dto.ExamResponse;
import com.unifor.br.medical_records_service.dto.MedicalRecordResponse;
import com.unifor.br.medical_records_service.dto.MedicationResponse;
import com.unifor.br.medical_records_service.dto.TimelineItemResponse;
import com.unifor.br.medical_records_service.exception.ConflictException;
import com.unifor.br.medical_records_service.exception.ResourceNotFoundException;
import com.unifor.br.medical_records_service.model.AppointmentEntry;
import com.unifor.br.medical_records_service.model.ExamEntry;
import com.unifor.br.medical_records_service.model.MedicalRecord;
import com.unifor.br.medical_records_service.model.MedicationEntry;
import com.unifor.br.medical_records_service.model.TimelineEventType;
import com.unifor.br.medical_records_service.repository.MedicalRecordRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository repository;
    private final PatientClient patientClient;
    private final DoctorClient doctorClient;

    public MedicalRecordResponse create(CreateMedicalRecordRequest request) {
        if (repository.existsByPatientId(request.idPaciente())) {
            throw new ConflictException("Paciente ja possui prontuario cadastrado.");
        }

        PatientSummaryResponse patient = patientClient.findById(request.idPaciente());
        LocalDateTime now = LocalDateTime.now();

        MedicalRecord medicalRecord = MedicalRecord.builder()
                .patientId(patient.id())
                .patientName(patient.nome())
                .patientBirthDate(patient.dataNascimento())
                .patientEmail(patient.email())
                .active(patient.isActive())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toResponse(repository.save(medicalRecord));
    }

    public MedicalRecordResponse findById(String id) {
        return toResponse(getEntityById(id));
    }

    public MedicalRecordResponse findByPatientId(UUID patientId) {
        return toResponse(getEntityByPatientId(patientId));
    }

    public AppointmentResponse addAppointment(String medicalRecordId, CreateAppointmentRequest request) {
        MedicalRecord medicalRecord = getEntityById(medicalRecordId);
        DoctorSummaryResponse doctor = doctorClient.findById(request.idProfissional());

        AppointmentEntry appointment = AppointmentEntry.builder()
                .id(UUID.randomUUID())
                .appointmentDate(request.dataAtendimento())
                .professionalId(request.idProfissional())
                .professionalName(doctor.nome())
                .appointmentType(request.tipoAtendimento())
                .clinicalNotes(request.observacoesClinicas().trim())
                .createdAt(LocalDateTime.now())
                .build();

        medicalRecord.getAppointments().add(appointment);
        medicalRecord.setUpdatedAt(LocalDateTime.now());
        repository.save(medicalRecord);
        return toAppointmentResponse(appointment);
    }

    public MedicationResponse addMedication(String medicalRecordId, CreateMedicationRequest request) {
        MedicalRecord medicalRecord = getEntityById(medicalRecordId);

        MedicationEntry medication = MedicationEntry.builder()
                .id(UUID.randomUUID())
                .medicationName(request.nomeMedicamento().trim())
                .dosage(request.dosagem().trim())
                .treatmentDuration(request.duracaoTratamento().trim())
                .notes(blankToNull(request.observacoes()))
                .startDate(request.dataInicio())
                .prescribedAt(LocalDateTime.now())
                .build();

        medicalRecord.getMedications().add(medication);
        medicalRecord.setUpdatedAt(LocalDateTime.now());
        repository.save(medicalRecord);
        return toMedicationResponse(medication);
    }

    public ExamResponse addExam(String medicalRecordId, CreateExamRequest request) {
        MedicalRecord medicalRecord = getEntityById(medicalRecordId);

        ExamEntry exam = ExamEntry.builder()
                .id(UUID.randomUUID())
                .examType(request.tipoExame().trim())
                .examDate(request.dataRealizacao())
                .resultText(blankToNull(request.resultadoTexto()))
                .resultData(request.resultadoEstruturado() == null
                        ? new LinkedHashMap<>()
                        : new LinkedHashMap<>(request.resultadoEstruturado()))
                .createdAt(LocalDateTime.now())
                .build();

        medicalRecord.getExams().add(exam);
        medicalRecord.setUpdatedAt(LocalDateTime.now());
        repository.save(medicalRecord);
        return toExamResponse(exam);
    }

    public List<TimelineItemResponse> getTimeline(String medicalRecordId) {
        return buildTimeline(getEntityById(medicalRecordId));
    }

    private MedicalRecord getEntityById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prontuario nao encontrado."));
    }

    private MedicalRecord getEntityByPatientId(UUID patientId) {
        return repository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Prontuario nao encontrado para o paciente informado."));
    }

    private MedicalRecordResponse toResponse(MedicalRecord medicalRecord) {
        return new MedicalRecordResponse(
                medicalRecord.getId(),
                medicalRecord.getPatientId(),
                medicalRecord.getPatientName(),
                medicalRecord.getPatientBirthDate(),
                medicalRecord.getPatientEmail(),
                medicalRecord.getActive(),
                medicalRecord.getCreatedAt(),
                medicalRecord.getUpdatedAt(),
                medicalRecord.getAppointments().stream().map(this::toAppointmentResponse).toList(),
                medicalRecord.getMedications().stream().map(this::toMedicationResponse).toList(),
                medicalRecord.getExams().stream().map(this::toExamResponse).toList(),
                buildTimeline(medicalRecord));
    }

    private AppointmentResponse toAppointmentResponse(AppointmentEntry appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentDate(),
                appointment.getProfessionalId(),
                appointment.getProfessionalName(),
                appointment.getAppointmentType(),
                appointment.getClinicalNotes(),
                appointment.getCreatedAt());
    }

    private MedicationResponse toMedicationResponse(MedicationEntry medication) {
        return new MedicationResponse(
                medication.getId(),
                medication.getMedicationName(),
                medication.getDosage(),
                medication.getTreatmentDuration(),
                medication.getNotes(),
                medication.getStartDate(),
                medication.getPrescribedAt());
    }

    private ExamResponse toExamResponse(ExamEntry exam) {
        return new ExamResponse(
                exam.getId(),
                exam.getExamType(),
                exam.getExamDate(),
                exam.getResultText(),
                exam.getResultData(),
                exam.getCreatedAt());
    }

    private List<TimelineItemResponse> buildTimeline(MedicalRecord medicalRecord) {
        List<TimelineItemResponse> items = new ArrayList<>();

        for (AppointmentEntry appointment : medicalRecord.getAppointments()) {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("idProfissional", appointment.getProfessionalId());
            details.put("nomeProfissional", appointment.getProfessionalName());
            details.put("tipoAtendimento", appointment.getAppointmentType());
            details.put("observacoesClinicas", appointment.getClinicalNotes());
            items.add(new TimelineItemResponse(
                    appointment.getId(),
                    TimelineEventType.APPOINTMENT,
                    appointment.getAppointmentDate(),
                    "Atendimento " + appointment.getAppointmentType().name(),
                    appointment.getClinicalNotes(),
                    details));
        }

        for (MedicationEntry medication : medicalRecord.getMedications()) {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("dosagem", medication.getDosage());
            details.put("duracaoTratamento", medication.getTreatmentDuration());
            details.put("observacoes", medication.getNotes());
            details.put("dataInicio", medication.getStartDate());
            items.add(new TimelineItemResponse(
                    medication.getId(),
                    TimelineEventType.MEDICATION,
                    medication.getStartDate() != null
                            ? medication.getStartDate().atStartOfDay()
                            : medication.getPrescribedAt(),
                    "Medicamento: " + medication.getMedicationName(),
                    medication.getDosage(),
                    details));
        }

        for (ExamEntry exam : medicalRecord.getExams()) {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("resultadoTexto", exam.getResultText());
            details.put("resultadoEstruturado", exam.getResultData());
            items.add(new TimelineItemResponse(
                    exam.getId(),
                    TimelineEventType.EXAM,
                    LocalDateTime.of(exam.getExamDate(), LocalTime.NOON),
                    "Exame: " + exam.getExamType(),
                    exam.getResultText() != null ? exam.getResultText() : "Resultado estruturado registrado",
                    details));
        }

        return items.stream()
                .sorted(Comparator.comparing(TimelineItemResponse::dataEvento).reversed())
                .toList();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

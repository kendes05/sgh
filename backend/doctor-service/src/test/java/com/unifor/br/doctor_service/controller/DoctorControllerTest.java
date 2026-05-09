package com.unifor.br.doctor_service.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unifor.br.doctor_service.config.SecurityConfig;
import com.unifor.br.doctor_service.dto.DoctorResponse;
import com.unifor.br.doctor_service.model.Doctor;
import com.unifor.br.doctor_service.service.DoctorService;

@WebMvcTest(DoctorController.class)
@Import(SecurityConfig.class)
class DoctorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DoctorService doctorService;

    private DoctorResponse buildResponse(UUID id) {
        DoctorResponse r = new DoctorResponse();
        r.setId(id);
        r.setNome("Dr. Carlos");
        r.setCrmCoren("CRM-1234");
        r.setSexo(Doctor.Sexo.MASCULINO);
        r.setEmail("carlos@hospital.com");
        r.setTelefone("85999990000");
        r.setEspecialidadePrincipal("Clínica Geral");
        r.setRole(Doctor.Role.medic);
        r.setIsActive(true);
        return r;
    }

    private String doctorRequestBody() {
        return """
                {
                  "nome": "Dr. Carlos",
                  "role": "medic",
                  "crmCoren": "CRM-1234",
                  "sexo": "MASCULINO",
                  "email": "carlos@hospital.com",
                  "telefone": "85999990000",
                  "especialidadePrincipal": "Clínica Geral"
                }
                """;
    }

    // GET /doctor

    @Test
    void listDoctors_deveRetornar200_comListaDeProfissionais() throws Exception {
        UUID id = UUID.randomUUID();
        when(doctorService.listDoctors()).thenReturn(List.of(buildResponse(id)));

        mockMvc.perform(get("/doctor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Dr. Carlos"))
                .andExpect(jsonPath("$[0].role").value("medic"));
    }

    @Test
    void listDoctors_deveRetornar200_comListaVazia() throws Exception {
        when(doctorService.listDoctors()).thenReturn(List.of());

        mockMvc.perform(get("/doctor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // GET /doctor/{id}

    @Test
    void getDoctorById_deveRetornar200_quandoProfissionalExiste() throws Exception {
        UUID id = UUID.randomUUID();
        when(doctorService.getDoctorById(id)).thenReturn(buildResponse(id));

        mockMvc.perform(get("/doctor/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("carlos@hospital.com"));
    }

    @Test
    void getDoctorById_deveRetornar404_quandoProfissionalNaoEncontrado() throws Exception {
        UUID id = UUID.randomUUID();
        when(doctorService.getDoctorById(id))
                .thenThrow(new com.unifor.br.doctor_service.exception.ResourceNotFoundException("Profissional nao encontrado."));

        mockMvc.perform(get("/doctor/" + id))
                .andExpect(status().isNotFound());
    }

    // GET /doctor/role/{role}

    @Test
    void getDoctorsByRole_deveRetornar200_comListaPorRole() throws Exception {
        UUID id = UUID.randomUUID();
        when(doctorService.getDoctorsByRole("medic")).thenReturn(List.of(buildResponse(id)));

        mockMvc.perform(get("/doctor/role/medic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].role").value("medic"));
    }

    @Test
    void getDoctorsByRole_deveRetornar200_comListaVazia() throws Exception {
        when(doctorService.getDoctorsByRole("nurse")).thenReturn(List.of());

        mockMvc.perform(get("/doctor/role/nurse"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // POST /doctor

    @Test
    void registerDoctor_deveRetornar201_quandoDadosValidos() throws Exception {
        UUID id = UUID.randomUUID();
        when(doctorService.registerDoctor(any())).thenReturn(buildResponse(id));

        mockMvc.perform(post("/doctor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Dr. Carlos"))
                .andExpect(jsonPath("$.crmCoren").value("CRM-1234"));
    }

    @Test
    void registerDoctor_deveRetornar409_quandoEmailJaCadastrado() throws Exception {
        when(doctorService.registerDoctor(any()))
                .thenThrow(new com.unifor.br.doctor_service.exception.ConflictException("Ja existe um profissional com este e-mail."));

        mockMvc.perform(post("/doctor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isConflict());
    }

    // PUT /doctor/{id}

    @Test
    void updateDoctor_deveRetornar200_quandoDadosValidos() throws Exception {
        UUID id = UUID.randomUUID();
        when(doctorService.updateDoctor(eq(id), any())).thenReturn(buildResponse(id));

        mockMvc.perform(put("/doctor/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Dr. Carlos"));
    }

    @Test
    void updateDoctor_deveRetornar404_quandoProfissionalNaoEncontrado() throws Exception {
        UUID id = UUID.randomUUID();
        when(doctorService.updateDoctor(eq(id), any()))
                .thenThrow(new com.unifor.br.doctor_service.exception.ResourceNotFoundException("Profissional nao encontrado."));

        mockMvc.perform(put("/doctor/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isNotFound());
    }

    // DELETE /doctor/{id}

    @Test
    void deleteDoctor_deveRetornar204_quandoProfissionalExiste() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(doctorService).deleteDoctor(id);

        mockMvc.perform(delete("/doctor/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteDoctor_deveRetornar404_quandoProfissionalNaoEncontrado() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new com.unifor.br.doctor_service.exception.ResourceNotFoundException("Profissional nao encontrado."))
                .when(doctorService).deleteDoctor(id);

        mockMvc.perform(delete("/doctor/" + id))
                .andExpect(status().isNotFound());
    }
}

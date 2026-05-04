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

    private DoctorResponse buildResponse(String id) {
        DoctorResponse r = new DoctorResponse();
        r.setId(UUID.fromString(id));
        r.setNome("Dr. Carlos");
        r.setCrm_coren("CRM-1234");
        r.setSexo("Masculino");
        r.setEmail("carlos@hospital.com");
        r.setTelefone("85999990000");
        r.setEspecialidadePrincipal("Clínica Geral");
        r.setRole("medic");
        return r;
    }

    private String doctorRequestBody() throws Exception {
        return """
                {
                  "nome": "Dr. Carlos",
                  "role": "medic",
                  "crm_coren": "CRM-1234",
                  "sexo": "Masculino",
                  "email": "carlos@hospital.com",
                  "telefone": "85999990000",
                  "especialidadePrincipal": "Clínica Geral"
                }
                """;
    }

    // GET /doctor

    @Test
    void listDoctors_deveRetornar200_comListaDeProfissionais() throws Exception {
        String id = UUID.randomUUID().toString();
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
        String id = UUID.randomUUID().toString();
        when(doctorService.getDoctorById(id)).thenReturn(buildResponse(id));

        mockMvc.perform(get("/doctor/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("carlos@hospital.com"));
    }

    @Test
    void getDoctorById_deveRetornar500_quandoProfissionalNaoEncontrado() throws Exception {
        String id = UUID.randomUUID().toString();
        when(doctorService.getDoctorById(id)).thenThrow(new RuntimeException("Médico não encontrado"));

        mockMvc.perform(get("/doctor/" + id))
                .andExpect(status().isInternalServerError());
    }

    // GET /doctor/role/{role}

    @Test
    void getDoctorsByRole_deveRetornar200_comListaPorRole() throws Exception {
        String id = UUID.randomUUID().toString();
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
    void registerDoctor_deveRetornar200_quandoDadosValidos() throws Exception {
        String id = UUID.randomUUID().toString();
        when(doctorService.registerDoctor(any())).thenReturn(buildResponse(id));

        mockMvc.perform(post("/doctor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Dr. Carlos"))
                .andExpect(jsonPath("$.crm_coren").value("CRM-1234"));
    }

    @Test
    void registerDoctor_deveRetornar500_quandoEmailJaCadastrado() throws Exception {
        when(doctorService.registerDoctor(any()))
                .thenThrow(new RuntimeException("Já existe um médico com este e-mail"));

        mockMvc.perform(post("/doctor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isInternalServerError());
    }

    // PUT /doctor/{id}

    @Test
    void updateDoctor_deveRetornar200_quandoDadosValidos() throws Exception {
        String id = UUID.randomUUID().toString();
        when(doctorService.updateDoctor(eq(id), any())).thenReturn(buildResponse(id));

        mockMvc.perform(put("/doctor/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Dr. Carlos"));
    }

    @Test
    void updateDoctor_deveRetornar500_quandoProfissionalNaoEncontrado() throws Exception {
        String id = UUID.randomUUID().toString();
        when(doctorService.updateDoctor(eq(id), any()))
                .thenThrow(new RuntimeException("Médico não encontrado"));

        mockMvc.perform(put("/doctor/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(doctorRequestBody()))
                .andExpect(status().isInternalServerError());
    }

    // DELETE /doctor/{id}

    @Test
    void deleteDoctor_deveRetornar204_quandoProfissionalExiste() throws Exception {
        String id = UUID.randomUUID().toString();
        doNothing().when(doctorService).deleteDoctor(id);

        mockMvc.perform(delete("/doctor/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteDoctor_deveRetornar500_quandoProfissionalNaoEncontrado() throws Exception {
        String id = UUID.randomUUID().toString();
        doThrow(new RuntimeException("Médico não encontrado"))
                .when(doctorService).deleteDoctor(id);

        mockMvc.perform(delete("/doctor/" + id))
                .andExpect(status().isInternalServerError());
    }
}

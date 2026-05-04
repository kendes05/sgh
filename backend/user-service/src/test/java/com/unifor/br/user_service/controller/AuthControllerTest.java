package com.unifor.br.user_service.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unifor.br.user_service.config.SecurityConfig;
import com.unifor.br.user_service.dto.LoginResponse;
import com.unifor.br.user_service.dto.UserLoginResponse;
import com.unifor.br.user_service.exception.BusinessException;
import com.unifor.br.user_service.exception.ResourceNotFoundException;
import com.unifor.br.user_service.security.JwtFilter;
import com.unifor.br.user_service.security.JwtService;
import com.unifor.br.user_service.service.AuthService;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtFilter jwtFilter;

    // POST /auth/register

    @Test
    void register_deveRetornar201_quandoDadosValidos() throws Exception {
        var body = Map.of("nome", "João Silva", "email", "joao@exemplo.com", "role", "medic");
        when(authService.registrar(any())).thenReturn(Map.of("authUserId", UUID.randomUUID().toString(), "senha", "Abc@1234"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authUserId").exists())
                .andExpect(jsonPath("$.senha").exists());
    }

    @Test
    void register_deveRetornar400_quandoEmailInvalido() throws Exception {
        var body = Map.of("nome", "João Silva", "email", "email-invalido", "role", "medic");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_deveRetornar400_quandoCamposObrigatoriosAusentes() throws Exception {
        var body = Map.of("email", "joao@exemplo.com");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    // POST /auth/login

    @Test
    void login_deveRetornar200_quandoCredenciaisValidas() throws Exception {
        var body = Map.of("email", "joao@exemplo.com", "senha", "Abc@1234");
        var userResp = new UserLoginResponse();
        userResp.setNome("João");
        userResp.setEmail("joao@exemplo.com");
        userResp.setRole("medic");
        when(authService.login(any())).thenReturn(new LoginResponse("token.jwt.aqui", false, userResp));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token.jwt.aqui"))
                .andExpect(jsonPath("$.mustChangePassword").value(false));
    }

    @Test
    void login_deveRetornar400_quandoCredenciaisInvalidas() throws Exception {
        var body = Map.of("email", "joao@exemplo.com", "senha", "errada");
        when(authService.login(any())).thenThrow(new BusinessException("Email ou senha incorretos."));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email ou senha incorretos."));
    }

    @Test
    void login_deveRetornar400_quandoBodyInvalido() throws Exception {
        var body = Map.of("email", "nao-e-email", "senha", "");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    // GET /auth/validate

    @Test
    void validate_deveRetornarTrue_quandoTokenValido() throws Exception {
        when(jwtService.tokenValido("token.valido")).thenReturn(true);

        mockMvc.perform(get("/auth/validate")
                        .header("Authorization", "Bearer token.valido"))
                .andExpect(status().isOk());
    }

    @Test
    void validate_deveRetornarFalse_quandoTokenInvalido() throws Exception {
        when(jwtService.tokenValido("token.invalido")).thenReturn(false);

        mockMvc.perform(get("/auth/validate")
                        .header("Authorization", "Bearer token.invalido"))
                .andExpect(status().isOk());
    }

    // PATCH /auth/users/{id}/email

    @Test
    void updateEmail_deveRetornar200_quandoDadosValidos() throws Exception {
        UUID userId = UUID.randomUUID();
        var body = Map.of("email", "novo@exemplo.com");
        doNothing().when(authService).updateEmail(eq(userId), any());

        mockMvc.perform(patch("/auth/users/" + userId + "/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email atualizado com sucesso."));
    }

    @Test
    void updateEmail_deveRetornar404_quandoUsuarioNaoEncontrado() throws Exception {
        UUID userId = UUID.randomUUID();
        var body = Map.of("email", "novo@exemplo.com");
        doThrow(new ResourceNotFoundException("Usuario nao encontrado ou inativo."))
                .when(authService).updateEmail(eq(userId), any());

        mockMvc.perform(patch("/auth/users/" + userId + "/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Usuario nao encontrado ou inativo."));
    }

    // DELETE /auth/users/{id}

    @Test
    void deactivateAccount_deveRetornar200_quandoUsuarioExiste() throws Exception {
        UUID userId = UUID.randomUUID();
        doNothing().when(authService).deactivateAccount(userId);

        mockMvc.perform(delete("/auth/users/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Conta inativada com sucesso."));
    }

    @Test
    void deactivateAccount_deveRetornar404_quandoUsuarioNaoEncontrado() throws Exception {
        UUID userId = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Usuario nao encontrado ou ja inativo."))
                .when(authService).deactivateAccount(userId);

        mockMvc.perform(delete("/auth/users/" + userId))
                .andExpect(status().isNotFound());
    }

    // PATCH /auth/change-password

    @Test
    void changePassword_deveRetornar200_quandoDadosValidos() throws Exception {
        var body = Map.of("senhaAtual", "Antiga@1", "novaSenha", "Nova@123", "confirmarNovaSenha", "Nova@123");
        when(jwtService.extrairEmail("token.valido")).thenReturn("joao@exemplo.com");
        doNothing().when(authService).changePassword(eq("joao@exemplo.com"), any());

        mockMvc.perform(patch("/auth/change-password")
                        .header("Authorization", "Bearer token.valido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Senha alterada com sucesso."));
    }

    @Test
    void changePassword_deveRetornar400_quandoSenhaAtualIncorreta() throws Exception {
        var body = Map.of("senhaAtual", "errada", "novaSenha", "Nova@123", "confirmarNovaSenha", "Nova@123");
        when(jwtService.extrairEmail("token.valido")).thenReturn("joao@exemplo.com");
        doThrow(new BusinessException("Senha atual incorreta."))
                .when(authService).changePassword(eq("joao@exemplo.com"), any());

        mockMvc.perform(patch("/auth/change-password")
                        .header("Authorization", "Bearer token.valido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Senha atual incorreta."));
    }
}

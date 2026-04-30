package com.unifor.br.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateUserEmailRequest(
        @NotBlank(message = "Novo email e obrigatorio")
        @Email(message = "Novo email invalido")
        String email) {
}

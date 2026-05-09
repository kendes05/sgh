package com.unifor.br.user_service.dto;

import java.util.UUID;

public record UserResponse(
    UUID id,
    String nome,
    String email,
    String role,
    Boolean isActive,
    Boolean mustChangePassword
) {}

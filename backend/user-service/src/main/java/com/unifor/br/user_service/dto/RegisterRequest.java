package com.unifor.br.user_service.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String nome;
    private String email;
}
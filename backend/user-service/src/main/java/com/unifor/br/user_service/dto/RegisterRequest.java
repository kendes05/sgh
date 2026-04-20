package com.unifor.br.user_service.dto;

import com.unifor.br.user_service.model.Usuario;

import lombok.Data;

@Data
public class RegisterRequest {
    private String nome;
    private String email;
    private String role;
}
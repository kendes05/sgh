package com.unifor.br.user_service.dto;

import lombok.Data;

@Data
public class UserLoginResponse {
    private String nome;
    private String email;
    private String role;
}

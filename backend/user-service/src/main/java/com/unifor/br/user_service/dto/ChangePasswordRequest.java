package com.unifor.br.user_service.dto;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String senhaAtual;
    private String novaSenha;
    private String confirmarNovaSenha;
}
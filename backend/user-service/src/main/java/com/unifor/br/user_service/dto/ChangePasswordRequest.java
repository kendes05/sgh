package com.unifor.br.user_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Senha atual e obrigatoria")
    private String senhaAtual;

    @NotBlank(message = "Nova senha e obrigatoria")
    private String novaSenha;

    @NotBlank(message = "Confirmacao da nova senha e obrigatoria")
    private String confirmarNovaSenha;
}

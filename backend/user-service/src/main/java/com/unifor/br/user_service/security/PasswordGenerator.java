package com.unifor.br.user_service.security;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;
@Component
public class PasswordGenerator {
    
    public String gerarSenha() {
    String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    SecureRandom random = new SecureRandom();
    StringBuilder senha = new StringBuilder(10);
    
    for (int i = 0; i < 10; i++) {
        int index = random.nextInt(caracteres.length());
        senha.append(caracteres.charAt(index));
    }
    
    return senha.toString();
}

}

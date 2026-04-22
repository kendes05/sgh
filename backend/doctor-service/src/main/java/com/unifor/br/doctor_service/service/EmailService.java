package com.unifor.br.doctor_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarEmail(String destinatario, String assunto, String nome ,String mensagem) {
        SimpleMailMessage email = new SimpleMailMessage();
        email.setFrom("sghadm7@gmail.com");
        email.setTo(destinatario);
        email.setSubject(assunto);
        email.setText("Olá, " + nome + "!\n\n" + mensagem);
        
        mailSender.send(email);
    }
}

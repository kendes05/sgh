package com.unifor.br.patient_service.client;

public record AuthRequest(String email, String senha, String nome) {}
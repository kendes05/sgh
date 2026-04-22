package com.unifor.br.doctor_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@FeignClient(name = "auth-service", url = "${AUTH_SERVICE_URL}")
public interface AuthClient {

    @PostMapping("/auth/register")
    AuthResponse register(@RequestBody AuthRequest request);

    @DeleteMapping("/auth/delete-account")
    void deleteAccount(@RequestBody String email);
}
package com.unifor.br.doctor_service.client;

import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@FeignClient(name = "auth-service", url = "${AUTH_SERVICE_URL}")
public interface AuthClient {

    @PostMapping("/auth/register")
    AuthResponse register(@RequestBody AuthRequest request);

    @DeleteMapping("/auth/users/{id}")
    void deactivateAccount(@PathVariable("id") UUID authUserId);
}
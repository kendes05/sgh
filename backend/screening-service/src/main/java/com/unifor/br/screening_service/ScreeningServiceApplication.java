package com.unifor.br.screening_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class ScreeningServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ScreeningServiceApplication.class, args);
	}

}

package com.unifor.br.doctor_service.config;

import com.unifor.br.doctor_service.model.Medico;
import com.unifor.br.doctor_service.repository.MedicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor

    public class DataInitializer {

    // apaga o campo daqui

    @Bean
    public CommandLineRunner initData(MedicoRepository medicoRepository) { // recebe aqui
        return args -> {
            if (medicoRepository.count() == 0) {
                Medico medico = new Medico();
                medico.setUsuarioId(1L);
                medico.setNome("Dr. João Silva");
                medico.setCrm("CRM-CE 12345");
                medico.setEspecialidade("Clínica Geral");
                medicoRepository.save(medico);
            }
        };
    }
}
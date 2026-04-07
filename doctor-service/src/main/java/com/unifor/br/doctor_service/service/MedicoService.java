package com.unifor.br.doctor_service.service;

import com.unifor.br.doctor_service.dto.MedicoRequest;
import com.unifor.br.doctor_service.dto.MedicoResponse;
import com.unifor.br.doctor_service.dto.MedicoUpdateRequest;
import com.unifor.br.doctor_service.model.Medico;
import com.unifor.br.doctor_service.repository.MedicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor



public class MedicoService {

    private final MedicoRepository medicoRepository;

    // Cadastrar novo médico (apenas admin)
    public MedicoResponse cadastrar(MedicoRequest request) {
        if (medicoRepository.existsByCrm(request.getCrm())) {
            throw new RuntimeException("CRM já cadastrado: " + request.getCrm());
        }

        Medico medico = Medico.builder()
                .usuarioId(request.getUsuarioId())
                .nome(request.getNome())
                .crm(request.getCrm())
                .especialidade(request.getEspecialidade())
                .telefone(request.getTelefone())
                .email(request.getEmail())
                .build();

        return toResponse(medicoRepository.save(medico));
    }

    // Listar todos os médicos ativos
    public List<MedicoResponse> listarAtivos() {
        return medicoRepository.findByAtivoTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Buscar médico por ID
    public MedicoResponse buscarPorId(Long id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médico não encontrado: " + id));
        return toResponse(medico);
    }

    // Buscar por especialidade
    public List<MedicoResponse> buscarPorEspecialidade(String especialidade) {
        return medicoRepository.findByEspecialidadeIgnoreCase(especialidade)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Atualizar dados do médico
    public MedicoResponse atualizar(Long id, MedicoUpdateRequest request) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médico não encontrado: " + id));

        if (request.getEspecialidade() != null) medico.setEspecialidade(request.getEspecialidade());
        if (request.getTelefone() != null)      medico.setTelefone(request.getTelefone());
        if (request.getEmail() != null)         medico.setEmail(request.getEmail());

        return toResponse(medicoRepository.save(medico));
    }

    // Desativar médico (exclusão lógica — RF5)
    public void desativar(Long id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médico não encontrado: " + id));
        medico.setAtivo(false);
        medicoRepository.save(medico);
    }

    // Reativar médico
    public void reativar(Long id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médico não encontrado: " + id));
        medico.setAtivo(true);
        medicoRepository.save(medico);
    }

    // Converte entidade → DTO de resposta
    private MedicoResponse toResponse(Medico medico) {
        return MedicoResponse.builder()
                .id(medico.getId())
                .usuarioId(medico.getUsuarioId())
                .nome(medico.getNome())
                .crm(medico.getCrm())
                .especialidade(medico.getEspecialidade())
                .telefone(medico.getTelefone())
                .email(medico.getEmail())
                .ativo(medico.getAtivo())
                .criadoEm(medico.getCriadoEm())
                .build();
    }
}

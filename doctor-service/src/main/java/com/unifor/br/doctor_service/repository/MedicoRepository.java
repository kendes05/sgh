package com.unifor.br.doctor_service.repository;

import com.unifor.br.doctor_service.model.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {

    Optional<Medico> findByCrm(String crm);

    Optional<Medico> findByUsuarioId(Long usuarioId);

    List<Medico> findByEspecialidadeIgnoreCase(String especialidade);

    List<Medico> findByAtivoTrue();

    boolean existsByCrm(String crm);
}

package com.unifor.br.screening_service.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unifor.br.screening_service.model.DestinationSector;
import com.unifor.br.screening_service.model.Screening;
import com.unifor.br.screening_service.model.ScreeningStatus;

public interface ScreeningRepository extends JpaRepository<Screening, UUID> {

    boolean existsByPatientIdAndStatusIn(UUID patientId, Collection<ScreeningStatus> statuses);

    Optional<Screening> findFirstByPatientIdAndStatusInOrderByCreatedAtDesc(UUID patientId, Collection<ScreeningStatus> statuses);

    List<Screening> findByStatusOrderByCreatedAtDesc(ScreeningStatus status);

    List<Screening> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    List<Screening> findByDestinationSectorAndStatus(DestinationSector destinationSector, ScreeningStatus status);

    List<Screening> findByStatusIn(Collection<ScreeningStatus> statuses);

    List<Screening> findByDestinationSectorAndStatusIn(DestinationSector sector, Collection<ScreeningStatus> statuses);

    List<Screening> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}

package com.unifor.br.doctor_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Builder
@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_auth_id", unique = true, nullable = false)
    private String userAuthId;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "crm_coren", nullable = false, unique = true, length = 20)
    private String crmCoren;

    @Enumerated(EnumType.STRING)
    @Column(name = "sexo", nullable = false)
    private Sexo sexo;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "telefone", nullable = false, length = 20)
    private String telefone;

    @Column(name = "especialidade_principal", length = 100)
    private String especialidadePrincipal;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // -------------------------------------------------------
    // Enums de domínio
    // -------------------------------------------------------

    public enum Role {
        medic, nurse
    }

    public enum Sexo {
        MASCULINO, FEMININO, OUTRO
    }
}

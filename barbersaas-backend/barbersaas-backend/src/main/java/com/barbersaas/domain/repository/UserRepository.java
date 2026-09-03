package com.barbersaas.domain.repository;

import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.enums.Role;

import io.lettuce.core.dynamic.annotation.Param;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Para el dashboard: clientes que han reservado en esta barberia
    @org.springframework.data.jpa.repository.Query("""
           SELECT COUNT(DISTINCT a.client.id) FROM Appointment a
           WHERE a.barbershop.id = :barbershopId
           """)
    long countDistinctClientsByBarbershopId(@org.springframework.data.repository.query.Param("barbershopId") Long barbershopId);

    @org.springframework.data.jpa.repository.Query("""
           SELECT COUNT(DISTINCT a.client.id) FROM Appointment a
           WHERE a.barbershop.id = :barbershopId
             AND a.appointmentDate BETWEEN :from AND :to
           """)
    long countDistinctClientsInRange(@org.springframework.data.repository.query.Param("barbershopId") Long barbershopId,
                                       @org.springframework.data.repository.query.Param("from") LocalDate from,
                                       @org.springframework.data.repository.query.Param("to") LocalDate to);

    long countByRole(Role role);

    // Agregar a UserRepository.java

/**
 * Busca clientes (Role.CLIENT) que hayan tenido al menos una cita
 * en la barberia indicada, filtrando por coincidencia parcial
 * (case-insensitive) en nombre o correo.
 *
 * Se restringe a clientes "conocidos" de la barberia (con historial
 * de citas) en lugar de buscar entre TODOS los clientes de la
 * plataforma -- evita exponer datos de clientes de otras barberias
 * y mantiene el resultado relevante para otorgar sellos/recompensas.
 */
@Query("SELECT DISTINCT u FROM User u " +
       "WHERE u.role = com.barbersaas.domain.enums.Role.CLIENT " +
       "AND EXISTS (SELECT 1 FROM Appointment a WHERE a.client = u AND a.barbershop.id = :barbershopId) " +
       "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
       "     OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) " +
       "ORDER BY u.fullName ASC")
List<User> searchClientsByBarbershop(@Param("barbershopId") Long barbershopId, @Param("query") String query);
}
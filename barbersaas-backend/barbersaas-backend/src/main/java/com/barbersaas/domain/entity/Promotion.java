package com.barbersaas.domain.entity;

import com.barbersaas.domain.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Mapea la tabla "promotions" tal cual quedo en db/init.sql -- a diferencia
 * del resto del esquema, esta tabla NO tiene created_at/updated_at, asi que
 * este entity no debe llevar esos campos (Hibernate ddl-auto: validate
 * fallaria al arrancar si no calzan exacto, igual que paso con
 * barber_schedules durante la migracion a Postgres).
 */
@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbershop_id", nullable = false)
    private Barbershop barbershop;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to", nullable = false)
    private LocalDate validTo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}

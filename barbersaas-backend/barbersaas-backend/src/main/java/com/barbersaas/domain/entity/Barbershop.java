package com.barbersaas.domain.entity;

import com.barbersaas.domain.enums.BarbershopStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "barbershops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Barbershop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(nullable = false, length = 80)
    private String city;

    private Double latitude;
    private Double longitude;

    @Column(length = 20)
    private String phone;

    @Column(name = "whatsapp_number", length = 20)
    private String whatsappNumber;

    @Column(name = "logo_url")
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BarbershopStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private SubscriptionPlan plan;

    @Column(nullable = false)
    private String timezone;

    @Column(name = "cancellation_policy_hours", nullable = false)
    private Integer cancellationPolicyHours;

    @CreationTimestamp
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "trial_ends_at")
    private LocalDateTime trialEndsAt;

    /** % que se lleva cada barbero por defecto cuando no tiene su propio % configurado. */
    @Column(name = "default_commission_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal defaultCommissionPercentage;
}

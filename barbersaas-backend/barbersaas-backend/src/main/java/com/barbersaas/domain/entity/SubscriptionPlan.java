package com.barbersaas.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "max_barbers", nullable = false)
    private Integer maxBarbers;

    @Column(name = "features_json", columnDefinition = "json")
    private String featuresJson;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}

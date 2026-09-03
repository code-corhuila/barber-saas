package com.barbersaas.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "loyalty_rewards_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyRewardsConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbershop_id", nullable = false)
    private Barbershop barbershop;

    @Column(name = "stickers_required", nullable = false)
    private Integer stickersRequired;

    @Column(name = "reward_description", nullable = false, length = 255)
    private String rewardDescription;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
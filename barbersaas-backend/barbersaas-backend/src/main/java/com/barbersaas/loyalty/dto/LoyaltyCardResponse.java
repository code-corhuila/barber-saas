package com.barbersaas.loyalty.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyCardResponse {
    private Long id;
    private Long clientId;
    private String clientName;
    private Integer stickersCount;
    private Integer stickersRequired;
    private Integer totalRewardsRedeemed;
    private Boolean canRedeem;
    private String rewardDescription;
}
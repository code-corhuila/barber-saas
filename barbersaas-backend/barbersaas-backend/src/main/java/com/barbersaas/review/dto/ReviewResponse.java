package com.barbersaas.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long clientId;
    private String clientName;
    private Long barberProfileId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
package com.barbersaas.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GalleryImageResponse {
    private Long id;
    private String imageUrl;
    private String caption;
    private Long barberProfileId;
    private LocalDateTime createdAt;
}
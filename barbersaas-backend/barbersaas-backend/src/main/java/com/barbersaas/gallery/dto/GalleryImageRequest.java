package com.barbersaas.gallery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GalleryImageRequest {

    @NotBlank(message = "La URL de la imagen es obligatoria")
    private String imageUrl;

    private String caption;

    // Opcional: atribuir la foto a un barbero especifico
    private Long barberProfileId;
}
package com.barbersaas.gallery;

import com.barbersaas.gallery.dto.GalleryImageRequest;
import com.barbersaas.gallery.dto.GalleryImageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Galeria", description = "Portafolio de fotos de la barberia y barberos")
public class GalleryController {

    private final GalleryService galleryService;

    @GetMapping("/api/public/barbershops/{barbershopId}/gallery")
    @Operation(summary = "Ver la galeria de una barberia (publico)")
    public ResponseEntity<List<GalleryImageResponse>> getPublicGallery(@PathVariable Long barbershopId) {
        return ResponseEntity.ok(galleryService.getPublicGallery(barbershopId));
    }

    @GetMapping("/api/public/barbers/{barberProfileId}/gallery")
    @Operation(summary = "Ver la galeria de un barbero especifico (publico)")
    public ResponseEntity<List<GalleryImageResponse>> getBarberGallery(@PathVariable Long barberProfileId) {
        return ResponseEntity.ok(galleryService.getBarberGallery(barberProfileId));
    }

    @PostMapping("/api/admin/gallery")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Subir una imagen al portafolio (requiere imageUrl ya subida a un storage externo)")
    public ResponseEntity<GalleryImageResponse> addImage(@Valid @RequestBody GalleryImageRequest request) {
        return ResponseEntity.ok(galleryService.addImage(request));
    }

    @PostMapping("/api/admin/gallery/upload")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Subir una imagen al portafolio (archivo real, sin necesitar storage externo)")
    public ResponseEntity<GalleryImageResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) Long barberProfileId) {
        return ResponseEntity.ok(galleryService.uploadImage(file, caption, barberProfileId));
    }

    @DeleteMapping("/api/admin/gallery/{id}")
    @PreAuthorize("hasRole('ADMIN_BARBERSHOP')")
    @Operation(summary = "Eliminar una imagen del portafolio")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        galleryService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }
}
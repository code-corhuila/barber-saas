package com.barbersaas.gallery;

import com.barbersaas.domain.entity.Barbershop;
import com.barbersaas.domain.entity.BarberProfile;
import com.barbersaas.domain.entity.GalleryImage;
import com.barbersaas.domain.repository.BarberProfileRepository;
import com.barbersaas.domain.repository.BarbershopRepository;
import com.barbersaas.domain.repository.GalleryImageRepository;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ForbiddenException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.gallery.dto.GalleryImageRequest;
import com.barbersaas.gallery.dto.GalleryImageResponse;
import com.barbersaas.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private final GalleryImageRepository galleryImageRepository;
    private final BarbershopRepository barbershopRepository;
    private final BarberProfileRepository barberProfileRepository;

    @Value("${app.upload-dir}")
    private String uploadDir;

    /** Publico: portafolio de una barberia, usado por clientes antes de reservar. */
    public List<GalleryImageResponse> getPublicGallery(Long barbershopId) {
        return galleryImageRepository.findByBarbershopIdOrderByCreatedAtDesc(barbershopId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Publico: portafolio especifico de un barbero. */
    public List<GalleryImageResponse> getBarberGallery(Long barberProfileId) {
        return galleryImageRepository.findByBarberProfileIdOrderByCreatedAtDesc(barberProfileId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GalleryImageResponse addImage(GalleryImageRequest request) {
        return saveImage(request.getImageUrl(), request.getCaption(), request.getBarberProfileId());
    }

    /**
     * Sube un archivo real (multipart) y crea el registro de galeria en un
     * solo paso -- misma idea que UserService.uploadProfilePhoto, guarda en
     * uploads/gallery/ (servido publicamente por /uploads/**).
     */
    @Transactional
    public GalleryImageResponse uploadImage(MultipartFile file, String caption, Long barberProfileId) {
        if (file.isEmpty()) {
            throw new BadRequestException("El archivo esta vacio");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Solo se permiten imagenes JPEG, PNG o WEBP");
        }

        String extension = switch (file.getContentType()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String filename = "gallery-" + UUID.randomUUID() + extension;

        try {
            Path targetDir = Path.of(uploadDir, "gallery");
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetDir.resolve(filename));
        } catch (IOException e) {
            throw new BadRequestException("No se pudo guardar la imagen");
        }

        return saveImage("/uploads/gallery/" + filename, caption, barberProfileId);
    }

    private GalleryImageResponse saveImage(String imageUrl, String caption, Long barberProfileId) {
        Long barbershopId = requireTenant();

        Barbershop barbershop = barbershopRepository.findById(barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Barberia no encontrada"));

        BarberProfile barberProfile = null;
        if (barberProfileId != null) {
            barberProfile = barberProfileRepository.findById(barberProfileId)
                    .orElseThrow(() -> new ResourceNotFoundException("Barbero no encontrado"));

            if (!barberProfile.getBarbershop().getId().equals(barbershopId)) {
                throw new BadRequestException("El barbero no pertenece a esta barberia");
            }
        }

        GalleryImage image = GalleryImage.builder()
                .barbershop(barbershop)
                .barberProfile(barberProfile)
                .imageUrl(imageUrl)
                .caption(caption)
                .build();

        return toResponse(galleryImageRepository.save(image));
    }

    @Transactional
    public void deleteImage(Long imageId) {
        Long barbershopId = requireTenant();

        GalleryImage image = galleryImageRepository.findByIdAndBarbershopId(imageId, barbershopId)
                .orElseThrow(() -> new ResourceNotFoundException("Imagen no encontrada"));

        galleryImageRepository.delete(image);
    }

    private Long requireTenant() {
        Long barbershopId = TenantContext.getTenantId();
        if (barbershopId == null) {
            throw new ForbiddenException("Esta operacion requiere estar asociado a una barberia");
        }
        return barbershopId;
    }

    private GalleryImageResponse toResponse(GalleryImage image) {
        return GalleryImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .caption(image.getCaption())
                .barberProfileId(image.getBarberProfile() != null ? image.getBarberProfile().getId() : null)
                .createdAt(image.getCreatedAt())
                .build();
    }
}
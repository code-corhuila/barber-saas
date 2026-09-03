package com.barbersaas.user;

import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.repository.UserRepository;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.exception.ResourceNotFoundException;
import com.barbersaas.mapper.UserMapper;
import com.barbersaas.user.dto.UpdateProfileRequest;
import com.barbersaas.user.dto.UserResponse;
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
public class UserService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse uploadProfilePhoto(String email, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("El archivo esta vacio");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Solo se permiten imagenes JPEG, PNG o WEBP");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        String extension = switch (file.getContentType()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String filename = "user-" + user.getId() + "-" + UUID.randomUUID() + extension;

        try {
            Path targetDir = Path.of(uploadDir, "profile-photos");
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetDir.resolve(filename));
        } catch (IOException e) {
            throw new BadRequestException("No se pudo guardar la imagen");
        }

        user.setProfilePhotoUrl("/uploads/profile-photos/" + filename);
        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }
}

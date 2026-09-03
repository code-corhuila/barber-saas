package com.barbersaas.user;

import com.barbersaas.user.dto.UpdateProfileRequest;
import com.barbersaas.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Operaciones sobre el usuario autenticado")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Obtener informacion del usuario autenticado")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentUser(email));
    }

    @PutMapping("/me")
    @Operation(summary = "Editar nombre/telefono del usuario autenticado")
    public ResponseEntity<UserResponse> updateProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @PostMapping("/me/photo")
    @Operation(summary = "Subir/actualizar la foto de perfil del usuario autenticado")
    public ResponseEntity<UserResponse> uploadProfilePhoto(Authentication authentication, @RequestParam("file") MultipartFile file) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.uploadProfilePhoto(email, file));
    }
}

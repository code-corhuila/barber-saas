package com.barbersaas.auth;

import com.barbersaas.auth.dto.AuthResponse;
import com.barbersaas.auth.dto.ForgotPasswordRequest;
import com.barbersaas.auth.dto.LoginRequest;
import com.barbersaas.auth.dto.RegisterRequest;
import com.barbersaas.auth.dto.ResetPasswordRequest;
import com.barbersaas.barbershop.dto.SelfRegisterBarbershopRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticacion", description = "Registro y login de usuarios")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Registrar un nuevo cliente")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesion")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register-barbershop")
@Operation(summary = "Auto-registro de un nuevo dueno de barberia (crea cuenta + barberia + plan)")
public ResponseEntity<AuthResponse> registerBarbershopOwner(@Valid @RequestBody SelfRegisterBarbershopRequest request) {
    return ResponseEntity.ok(authService.registerBarbershopOwner(request));
}

@PostMapping("/forgot-password")
@Operation(summary = "Solicitar codigo de recuperacion de contrasena")
public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.forgotPassword(request);
    return ResponseEntity.ok().build();
}

@PostMapping("/reset-password")
@Operation(summary = "Restablecer contrasena con el codigo recibido")
public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    authService.resetPassword(request);
    return ResponseEntity.ok().build();
}
}

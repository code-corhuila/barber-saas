package com.barbersaas.auth;

import com.barbersaas.auth.dto.AuthResponse;
import com.barbersaas.auth.dto.ForgotPasswordRequest;
import com.barbersaas.auth.dto.LoginRequest;
import com.barbersaas.auth.dto.RegisterRequest;
import com.barbersaas.auth.dto.ResetPasswordRequest;
import com.barbersaas.barbershop.BarbershopService;
import com.barbersaas.barbershop.dto.SelfRegisterBarbershopRequest;
import com.barbersaas.domain.entity.PasswordResetToken;
import com.barbersaas.domain.entity.User;
import com.barbersaas.domain.enums.Role;
import com.barbersaas.domain.repository.PasswordResetTokenRepository;
import com.barbersaas.domain.repository.UserRepository;
import com.barbersaas.exception.BadRequestException;
import com.barbersaas.notification.EmailService;
import com.barbersaas.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final BarbershopService barbershopService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    /**
     * Registro publico. Siempre crea un usuario con rol CLIENT.
     * Los roles ADMIN_BARBERSHOP y BARBER son creados por
     * SUPER_ADMIN / ADMIN_BARBERSHOP respectivamente en endpoints protegidos.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El correo ya esta registrado");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.CLIENT)
                .isActive(true)
                .barbershop(null)
                .build();

        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Credenciales invalidas"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Credenciales invalidas");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Usuario inactivo. Contacte al administrador.");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        Long barbershopId = user.getBarbershop() != null ? user.getBarbershop().getId() : null;

        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getEmail(), user.getRole().name(), barbershopId);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .barbershopId(barbershopId)
                .build();
    }

    /**
 * Auto-registro de un dueno de barberia: delega la creacion atomica
 * de User+Barbershop en BarbershopService, y construye la respuesta
 * de autenticacion (JWT) igual que register()/login(), para que el
 * dueno quede logueado inmediatamente tras completar el wizard.
 */
@Transactional
public AuthResponse registerBarbershopOwner(SelfRegisterBarbershopRequest request) {
    BarbershopService.AuthResponseData result = barbershopService.selfRegister(request);
    return buildAuthResponse(result.owner());
    
}

/**
 * Genera un codigo de 6 digitos, lo guarda en BD con expiracion
 * de 15 minutos, e invalida cualquier codigo previo del mismo usuario.
 * Si el correo no existe, no revela ese dato por seguridad
 * (responde igual que si existiera).
 */
@Transactional
public void forgotPassword(ForgotPasswordRequest request) {
    userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
        // Invalida tokens previos no usados de este usuario
        passwordResetTokenRepository.invalidateAllByUserId(user.getId());

        // Genera codigo de 6 digitos
        String code = String.format("%06d", new java.util.Random().nextInt(999999));

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(code)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetCode(user.getEmail(), user.getFullName(), code);
    });
}

/**
 * Valida el codigo y actualiza la contrasena del usuario.
 * Invalida el token usado para que no pueda reutilizarse.
 */
@Transactional
public void resetPassword(ResetPasswordRequest request) {
    PasswordResetToken resetToken = passwordResetTokenRepository
            .findByTokenAndUsedFalse(request.getToken())
            .orElseThrow(() -> new BadRequestException("El codigo es invalido o ya fue usado"));

    if (!resetToken.getUser().getEmail().equalsIgnoreCase(request.getEmail())) {
        throw new BadRequestException("El codigo no corresponde a este correo");
    }

    if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
        throw new BadRequestException("El codigo ha expirado. Solicita uno nuevo.");
    }

    User user = resetToken.getUser();
    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);

    resetToken.setUsed(true);
    passwordResetTokenRepository.save(resetToken);
}
}

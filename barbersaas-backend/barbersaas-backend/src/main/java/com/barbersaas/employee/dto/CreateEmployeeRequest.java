package com.barbersaas.employee.dto;

import com.barbersaas.domain.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateEmployeeRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String fullName;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato valido")
    private String email;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(min = 8, message = "La contrasena debe tener al menos 8 caracteres")
    private String password;

    @NotBlank(message = "El telefono es obligatorio")
    private String phone;

    /**
     * Rol del nuevo empleado dentro de la barberia.
     * Solo se permiten ADMIN_BARBERSHOP o BARBER (validado en el service).
     */
    @NotNull(message = "El rol es obligatorio")
    private Role role;

    // Campos opcionales, solo aplican si role = BARBER
    private Integer experienceYears;
    private String bio;
}
package com.barbersaas.barbershop.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateBarbershopOwnerRequest {

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
}
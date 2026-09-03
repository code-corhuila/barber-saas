package com.barbersaas.barbershop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SelfRegisterBarbershopRequest {

    // Datos del dueño
    @NotBlank(message = "El nombre del propietario es obligatorio")
    private String ownerFullName;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato valido")
    private String ownerEmail;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(min = 8, message = "La contrasena debe tener al menos 8 caracteres")
    private String ownerPassword;

    @NotBlank(message = "El telefono del propietario es obligatorio")
    private String ownerPhone;

    // Datos de la barberia
    @NotBlank(message = "El nombre de la barberia es obligatorio")
    private String barbershopName;

    private String address;

    @NotBlank(message = "La ciudad es obligatoria")
    private String city;

    @NotBlank(message = "El telefono de la barberia es obligatorio")
    private String barbershopPhone;

    // Plan elegido
    @NotNull(message = "Debe seleccionar un plan")
    private Long planId;
}
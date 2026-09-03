package com.barbersaas.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String fullName;

    private String phone;
}

package com.barbersaas.appointment.dto;

import lombok.Data;

@Data
public class CancelAppointmentRequest {
    private String reason;
}
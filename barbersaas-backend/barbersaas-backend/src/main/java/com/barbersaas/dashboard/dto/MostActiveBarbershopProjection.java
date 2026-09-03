package com.barbersaas.dashboard.dto;

public interface MostActiveBarbershopProjection {
    Long getBarbershopId();
    String getName();
    Long getTotalAppointments();
}
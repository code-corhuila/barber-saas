package com.barbersaas.dashboard.dto;

/** Proyeccion para "barbero mas solicitado" */
public interface TopBarberProjection {
    Long getBarberProfileId();
    String getBarberName();
    Long getTotalAppointments();
}
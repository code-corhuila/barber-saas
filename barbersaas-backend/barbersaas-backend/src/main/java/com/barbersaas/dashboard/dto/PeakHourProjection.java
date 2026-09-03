package com.barbersaas.dashboard.dto;

/** Proyeccion para "horas pico" */
public interface PeakHourProjection {
    Integer getHourOfDay();
    Long getTotalAppointments();
}
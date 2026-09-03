package com.barbersaas.dashboard.dto;

/** Proyeccion para "servicios mas vendidos" */
public interface TopServiceProjection {
    Long getServiceId();
    String getServiceName();
    Long getTotalBookings();
}
package com.barbersaas.security;

/**
 * Almacena en un ThreadLocal el tenant (barbershopId) y el rol del usuario
 * autenticado durante el ciclo de vida de la request actual.
 *
 * IMPORTANTE: siempre debe llamarse a clear() al finalizar la request
 * (ver JwtAuthenticationFilter), de lo contrario se pueden filtrar datos
 * de un tenant a otro si el contenedor reutiliza threads.
 */
public class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_ROLE = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setTenantId(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Long getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void setRole(String role) {
        CURRENT_ROLE.set(role);
    }

    public static String getRole() {
        return CURRENT_ROLE.get();
    }

    public static void setUserId(Long userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static Long getUserId() {
        return CURRENT_USER_ID.get();
    }

    public static boolean isSuperAdmin() {
        return "SUPER_ADMIN".equals(CURRENT_ROLE.get());
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        CURRENT_ROLE.remove();
        CURRENT_USER_ID.remove();
    }
}

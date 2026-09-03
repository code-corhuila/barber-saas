package com.barbersaas.exception;

/**
 * Lanzada cuando un usuario autenticado intenta acceder a datos
 * de otro tenant (otra barberia) o realizar una accion no permitida
 * para su rol.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}

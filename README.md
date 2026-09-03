# BarberSaaS

SaaS multi-tenant para la gestión integral de barberías en Colombia: agenda y reserva de
citas, administración de personal y horarios, programa de fidelidad, control financiero e
inventario, y notificaciones push. Cuatro roles de usuario: `client`, `barber`, `admin`
(dueño de barbería) y `super-admin` (operador de la plataforma).

Proyecto del curso **Sistemas Distribuidos** (Grupo G2).

## Equipo

| Integrante | Rol |
|---|---|
| Carlos Mauricio Leal Medina | Tech Lead / Lead Developer |
| Daniel Felipe Cerquera Idrobo | Developer |
| Juan Pablo Borrero Morales | Developer |
| Carolay Arraut Heredia | Developer |

## Estado del proyecto

En desarrollo activo. El backend (Java 21 / Spring Boot) y la app móvil (Expo / React
Native) ya tienen implementados los módulos centrales: autenticación, gestión de
barberías y empleados, citas, horarios, fidelidad, finanzas, inventario, notificaciones y
promociones. La documentación de arquitectura y dominio vive en un repositorio aparte
(`barber-saas-docs`).

## Ramas de trabajo

Este repo usa tres ramas:

| Rama | Uso |
|---|---|
| `develop` | **Rama activa de desarrollo — es donde está el código real hoy.** Todo el trabajo en curso se hace acá. |
| `qa` | Pruebas antes de pasar a producción. |
| `main` | Rama estable / release. Se promueve desde `qa` cuando una versión queda lista. |

**Para ver el código del backend y la app móvil, cambiate a la rama `develop`** —
`main` todavía no tiene una versión promovida.

## Stack

- **Backend:** Java 21, Spring Boot 3.3.4, PostgreSQL/MySQL, Redis, JWT, Docker.
- **Móvil:** Expo, React Native, TypeScript, TanStack Query, Zustand.

## Cómo levantar el entorno

```bash
git checkout develop
docker compose up
```

Levanta PostgreSQL/MySQL, Redis, el backend y Nginx en una sola red, con los datos en un
volumen persistente.

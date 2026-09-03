# BarberSaaS

SaaS multi-tenant para la gestión integral de barberías en Colombia: agenda y reserva de
citas, administración de personal y horarios, programa de fidelidad, control financiero e
inventario, y notificaciones push. Cuatro roles de usuario: `client`, `barber`, `admin`
(dueño de barbería) y `super-admin` (operador de la plataforma).

Proyecto del curso **Sistemas Distribuidos** (Grupo G2).

> **Estás en la rama `develop`** — la rama activa de desarrollo, donde vive el código real
> hoy. `main` y `qa` todavía no tienen una versión promovida.

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

## Estructura de este repo

```
barbersaas-backend/barbersaas-backend/     → Backend Spring Boot (Java 21)
barbersaas-frontend (2)/.../barbersaas-mobile/  → App móvil (Expo / React Native)
e2e-tests/                                 → Pruebas end-to-end (Playwright)
perf-tests/                                → Pruebas de carga
docker-compose.yml                         → Levanta todo el stack en contenedores
```

## Ramas de trabajo

| Rama | Uso |
|---|---|
| `develop` | **Acá.** Todo el trabajo en curso se hace en esta rama. |
| `qa` | Pruebas antes de pasar a producción. |
| `main` | Rama estable / release, se promueve desde `qa`. |

## Stack

- **Backend:** Java 21, Spring Boot 3.3.4, PostgreSQL/MySQL, Redis, JWT, Docker.
- **Móvil:** Expo, React Native, TypeScript, TanStack Query, Zustand.

## Cómo levantar el entorno

```bash
docker compose up
```

Levanta PostgreSQL/MySQL, Redis, el backend y Nginx en una sola red, con los datos en un
volumen persistente.

Para la app móvil (fuera de Docker, con Metro bundler):

```bash
cd "barbersaas-frontend (2)/barbersaas-frontend/barbersaas-mobile"
npm install
npx expo start
```

# BarberSaaS Backend

Plataforma SaaS multi-tenant para gestion de barberias. Backend desarrollado con
Spring Boot 3 + Java 21, JWT, Spring Security, JPA/Hibernate y PostgreSQL.

## Stack

- Java 21
- Spring Boot 3.3.x (Web, Security, Data JPA, Validation, Data Redis)
- PostgreSQL 16
- Redis 7
- JWT (jjwt 0.12.x)
- MapStruct + Lombok
- Swagger / OpenAPI (springdoc)
- Docker / docker-compose + Nginx

## Estructura del proyecto

```
src/main/java/com/barbersaas/
├── BarberSaasApplication.java
├── config/          # SecurityConfig, CorsConfig, SwaggerConfig
├── security/         # JWT provider, filtro JWT, TenantContext
├── domain/
│   ├── entity/       # Entidades JPA
│   ├── enums/        # Role, BarbershopStatus
│   └── repository/   # Repositorios Spring Data
├── auth/             # Login / Registro
├── user/             # Endpoint de usuario autenticado
├── mapper/           # MapStruct mappers
└── exception/        # Manejo global de errores
```

## Requisitos previos

- JDK 21
- Maven 3.9+ (o usar `./mvnw`)
- PostgreSQL 16 corriendo localmente, o Docker

## Ejecucion local (sin Docker)

1. Crea la base de datos y carga el esquema + datos de prueba:

```bash
createdb -U postgres barbersaas
psql -U postgres -d barbersaas -f db/init.sql
```

2. Ajusta credenciales si es necesario (variables de entorno o `application.yml`):

```bash
export DB_USER=postgres
export DB_PASSWORD=root
export JWT_SECRET=una_clave_secreta_larga_de_al_menos_256_bits
export FCM_CREDENTIALS_PATH=./secrets/firebase-service-account.json
```

> `secrets/firebase-service-account.json` es una credencial real de Firebase y **no** se
> empaqueta en el JAR ni en la imagen Docker: se carga en runtime desde la ruta que indica
> `FCM_CREDENTIALS_PATH`. Sin esa variable, el backend arranca igual pero con las
> notificaciones push deshabilitadas.

3. Asegurate de tener Redis corriendo (`redis-server`), o comenta temporalmente
   la dependencia `spring-boot-starter-data-redis` si aun no la usas.

4. Compila y ejecuta:

```bash
./mvnw clean install
./mvnw spring-boot:run
```

5. La API estara disponible en `http://localhost:8080`
   Swagger UI: `http://localhost:8080/swagger-ui.html`

## Ejecucion con Docker

```bash
docker-compose up --build
```

Esto levanta: PostgreSQL (con el esquema y seeders ya cargados), Redis, el backend
Spring Boot y un Nginx como reverse proxy en el puerto 80.

## Usuarios de prueba (seeders)

Todos con contrasena: `Password123`

| Rol | Email |
|---|---|
| SUPER_ADMIN | superadmin@barbersaas.com |
| ADMIN_BARBERSHOP | carlos@estilourbano.com |
| BARBER | andres@estilourbano.com |
| CLIENT | maria.cliente@gmail.com |

## Endpoints disponibles (Fase 2)

- `POST /api/auth/register` — registro publico (crea rol CLIENT)
- `POST /api/auth/login` — login, retorna JWT
- `GET /api/users/me` — informacion del usuario autenticado (requiere `Authorization: Bearer <token>`)

## Multi-tenancy

El aislamiento entre barberias se implementa mediante una columna `barbershop_id`
en las tablas relevantes. El JWT incluye `barbershopId` y `role`; el filtro
`JwtAuthenticationFilter` puebla `TenantContext` (ThreadLocal) en cada request,
que los servicios usaran para filtrar automaticamente las consultas por tenant.

## Roadmap (siguientes fases)

- Fase 3: Modulo de Barberias (CRUD por SUPER_ADMIN) y gestion de empleados/barberos por ADMIN_BARBERSHOP
- Fase 4: Servicios, horarios y disponibilidad
- Fase 5: Sistema de citas (reservas, estados, cancelaciones)
- Fase 6: Fidelizacion, reviews, inventario y finanzas
- Fase 7: Dashboards y reportes

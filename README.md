# BarberSaaS

Multi-tenant SaaS for barbershop management in Colombia: appointment scheduling, staff and
schedule management, a loyalty program, financial and inventory tracking, and push
notifications. Four user roles: `client`, `barber`, `admin` (barbershop owner), and
`super-admin` (platform operator).

Project for the **Distributed Systems** course (Group G2).

> **Work in progress.** What is currently in this repository reflects the project's
> progress so far during the course — it is **not** the final product. Features,
> structure, and documentation are still being built and will keep changing.

> **You are on the `develop` branch** — the active development branch, where the real code
> lives today. `main` and `qa` do not have a promoted version yet.

## Team

| Member | Role |
|---|---|
| Carlos Mauricio Leal Medina | Tech Lead / Lead Developer |
| Daniel Felipe Cerquera Idrobo | Developer |
| Juan Pablo Borrero Morales | Developer |
| Carolay Arraut Heredia | Developer |

## Project status

Under active development. The backend (Java 21 / Spring Boot) and the mobile app (Expo /
React Native) already have the core modules implemented: authentication, barbershop and
employee management, appointments, schedules, loyalty, finance, inventory, notifications,
and promotions. Architecture and domain documentation lives in a separate repository
(`barber-saas-docs`).

## Repo structure

```
barbersaas-backend/barbersaas-backend/          → Backend Spring Boot (Java 21)
barbersaas-frontend (2)/.../barbersaas-mobile/  → Mobile app (Expo / React Native)
e2e-tests/                                      → End-to-end tests (Playwright)
perf-tests/                                     → Load tests
docker-compose.yml                              → Brings up the whole stack in containers
```

## Branch workflow

| Branch | Purpose |
|---|---|
| `develop` | **You are here.** All ongoing work happens on this branch. |
| `qa` | Testing before promoting to production. |
| `main` | Stable / release branch, promoted from `qa`. |

## Stack

- **Backend:** Java 21, Spring Boot 3.3.4, PostgreSQL/MySQL, Redis, JWT, Docker.
- **Mobile:** Expo, React Native, TypeScript, TanStack Query, Zustand.

## Getting started

```bash
docker compose up
```

Brings up PostgreSQL/MySQL, Redis, the backend, and Nginx on a single network, with data
persisted in a volume.

For the mobile app (outside Docker, with the Metro bundler):

```bash
cd "barbersaas-frontend (2)/barbersaas-frontend/barbersaas-mobile"
npm install
npx expo start
```

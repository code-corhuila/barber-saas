# BarberSaaS

Multi-tenant SaaS for barbershop management in Colombia: appointment scheduling, staff and
schedule management, a loyalty program, financial and inventory tracking, and push
notifications. Four user roles: `client`, `barber`, `admin` (barbershop owner), and
`super-admin` (platform operator).

Project for the **Distributed Systems** course (Group G2).

> **Work in progress.** What is currently in this repository reflects the project's
> progress so far during the course — it is **not** the final product. Features,
> structure, and documentation are still being built and will keep changing.

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

## Branch workflow

This repo uses three branches:

| Branch | Purpose |
|---|---|
| `develop` | **Active development branch — this is where the real code lives today.** All ongoing work happens here. |
| `qa` | Testing before promoting to production. |
| `main` | Stable / release branch. Promoted from `qa` once a version is ready. |

**To see the backend and mobile app code, switch to the `develop` branch** — `main` does
not have a promoted version yet.

## Stack

- **Backend:** Java 21, Spring Boot 3.3.4, PostgreSQL/MySQL, Redis, JWT, Docker.
- **Mobile:** Expo, React Native, TypeScript, TanStack Query, Zustand.

## Getting started

```bash
git checkout develop
docker compose up
```

Brings up PostgreSQL/MySQL, Redis, the backend, and Nginx on a single network, with data
persisted in a volume.

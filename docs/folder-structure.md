# Folder Structure

```text
.
|-- apps
|   |-- api
|   |   `-- .gitkeep
|   `-- web
|       `-- .gitkeep
|-- docs
|   |-- architecture.md
|   |-- folder-structure.md
|   |-- phase-roadmap.md
|   |-- security.md
|   `-- setup.md
|-- infra
|   |-- docker
|   |   `-- .gitkeep
|   |-- nginx
|   |   `-- .gitkeep
|   `-- aws
|       `-- .gitkeep
|-- packages
|   |-- config
|   |   `-- .gitkeep
|   |-- database
|   |   `-- .gitkeep
|   `-- shared
|       `-- .gitkeep
|-- tests
|   |-- e2e
|   |   `-- .gitkeep
|   `-- fixtures
|       `-- .gitkeep
|-- .env.example
|-- README.md
`-- SECURITY.md
```

## Directory Intent

### `apps/api`

Express TypeScript backend. Future phases will add REST APIs, Gmail polling jobs, parser services, verification logic, authentication, and authorization.

### `apps/web`

Next.js admin and verification frontend. Future phases will add dashboard views, verification forms, dark mode, and export controls.

### `packages/config`

Shared runtime configuration, bank whitelist configuration, validation schemas, and environment helpers.

### `packages/database`

Prisma schema, migrations, generated client wiring, seed scripts, and database-specific tests.

### `packages/shared`

Shared TypeScript types, constants, validation contracts, and DTOs used by both backend and frontend.

### `infra`

Docker, Nginx, and AWS deployment assets added in deployment phases.

### `tests`

Cross-application test fixtures and end-to-end tests. Unit tests will live beside the code they validate.


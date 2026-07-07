# AI Payment Verification System

Production-ready architecture for an AI-assisted payment verification system that only processes whitelisted bank transaction notification emails from Gmail.

This repository is being generated phase by phase.

## Current Status

Phase 1 is complete:

- Project architecture
- Folder structure
- System boundaries
- Security model
- Phase roadmap
- Local setup notes

Implementation phases that follow:

1. Database schema
2. Backend APIs
3. Gmail email reader
4. Email parser
5. Google Sheets sync
6. Payment verification engine
7. Frontend
8. Admin dashboard
9. Deployment

No later phase has been implemented yet.

## Core Requirement

The system must process only bank transaction notification emails.

Emails are eligible only when both checks pass:

1. Sender email is present in the approved bank whitelist.
2. Subject or body contains transaction-related keywords such as `credited`, `debited`, `transaction`, `UPI`, `IMPS`, `NEFT`, `RTGS`, `UTR`, or `reference number`.

All other emails must be ignored.

## Planned Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT with role based access control
- Integrations: Gmail API, Google Sheets API, OpenAI API
- Deployment: Docker, Docker Compose, Nginx, AWS EC2, AWS RDS PostgreSQL, CloudWatch

## Repository Layout

See [docs/folder-structure.md](docs/folder-structure.md).

## Architecture

See [docs/architecture.md](docs/architecture.md).

## Security

See [docs/security.md](docs/security.md).

## Setup

See [docs/setup.md](docs/setup.md).


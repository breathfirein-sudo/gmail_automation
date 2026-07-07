# Phase Roadmap

## Phase 1: Project Architecture

Status: Complete

Deliverables:

- Architecture documentation
- Folder structure
- Security model
- Setup notes
- Phase boundaries

## Phase 2: Database Schema

Planned deliverables:

- Prisma setup
- PostgreSQL schema
- `BankTransactions` table
- Verification tables as needed
- Status enums
- Unique UTR constraint
- Seed data for supported bank configuration
- Database tests

## Phase 3: Backend APIs

Planned deliverables:

- Express TypeScript app
- JWT authentication
- Role based authorization
- REST API contracts
- Input validation
- Rate limiting, Helmet, CORS
- API tests

## Phase 4: Gmail Email Reader

Planned deliverables:

- Google OAuth2 flow
- Gmail Inbox polling
- History ID tracking
- Duplicate prevention
- Approved sender pre-filter
- Polling tests with fixtures

## Phase 5: Email Parser

Planned deliverables:

- Regex parser
- Bank-specific pattern matching
- Confidence scoring
- OpenAI fallback parser
- Structured JSON validation
- Parser tests for bank fixtures

## Phase 6: Google Sheets Sync

Planned deliverables:

- Google Sheets API client
- Idempotent row insertion
- Retry handling
- Sync status tracking
- Integration tests with mocks

## Phase 7: Payment Verification Engine

Planned deliverables:

- Customer verification submission
- Screenshot upload handling
- UTR and amount matching
- Automatic approval logic
- Manual review workflow
- Duplicate verification prevention

## Phase 8: Frontend

Planned deliverables:

- Next.js setup
- Tailwind CSS
- shadcn/ui
- Auth screens
- Customer verification form
- Responsive dark mode shell

## Phase 9: Admin Dashboard

Planned deliverables:

- Dashboard metrics
- Transaction search
- Manual review queue
- Verified payment history
- CSV, Excel, and PDF exports

## Phase 10: Deployment

Planned deliverables:

- Dockerfile setup
- Docker Compose
- Nginx reverse proxy
- GitHub Actions
- AWS EC2 and RDS deployment guide
- CloudWatch logging guide


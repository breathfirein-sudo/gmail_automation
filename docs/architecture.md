# Project Architecture

## Objective

Build a production-ready AI Payment Verification System that reads Gmail inbox messages, accepts only whitelisted bank transaction notification emails, extracts transaction data, stores verified transaction records in PostgreSQL, syncs selected fields to Google Sheets, and verifies customer payments by matching UTR and amount.

## System Boundary

The system must never behave like a general email processor.

It processes an email only when:

- The message is from Gmail Inbox.
- The sender email exactly matches a configured bank sender whitelist.
- The subject or normalized body includes transaction-related keywords.
- The message has not already been processed according to Gmail history tracking and stored message IDs.

Everything else is ignored without parsing, AI calls, database writes, or sheet sync.

## High-Level Components

### Gmail Reader

- Uses Gmail API with OAuth2.
- Reads only Inbox messages.
- Polls every 30 seconds.
- Stores Gmail history ID to prevent duplicate processing.
- Does not delete or mutate user emails.
- Passes only candidate messages to the bank email filter.

### Bank Email Filter

- Uses configured bank sender whitelist.
- Uses transaction keyword checks on subject and body.
- Rejects every non-whitelisted sender before parsing.
- Supports future banks through configuration, not code changes.

### Email Parser

- Attempts deterministic extraction first through regex and bank-specific pattern matching.
- Computes parsing confidence.
- Calls OpenAI only when deterministic confidence is below threshold.
- Returns structured JSON with normalized transaction fields.
- Keeps raw email body for traceability.

### Transaction Store

- Uses PostgreSQL through Prisma ORM.
- Stores normalized bank transactions.
- Enforces unique UTR values.
- Tracks transaction status for verification lifecycle.

### Google Sheets Sync

- Runs only after successful PostgreSQL persistence.
- Writes selected fields: UTR, amount, date, time, bank, transaction type, and status.
- Must be retryable and idempotent.

### Payment Verification Engine

- Accepts customer name, amount, UTR, and payment screenshot metadata.
- Looks up PostgreSQL by UTR.
- Approves only when UTR exists, amount matches, transaction type is Credit, and status is Unused.
- Moves all mismatches to Manual Review.
- Marks successful records Verified to prevent duplicate verification.

### Admin Backend

- Exposes REST APIs secured with JWT.
- Supports role based access.
- Provides transaction search, manual review, verification status updates, and export endpoints.

### Admin Frontend

- Uses Next.js, React, TypeScript, Tailwind CSS, and shadcn/ui.
- Provides responsive dark mode dashboard.
- Displays today's transactions, pending verification, verified records, and manual review queue.
- Supports search by UTR, amount, date, bank, and customer.
- Supports CSV, Excel, and PDF exports.

## Data Flow

1. Gmail polling job wakes every 30 seconds.
2. Gmail Reader fetches Inbox changes since the stored history ID.
3. Bank Email Filter rejects all non-whitelisted senders.
4. Keyword filter rejects non-transaction emails from approved senders.
5. Email Parser extracts structured transaction data.
6. Backend validates parsed transaction fields.
7. PostgreSQL stores the transaction with unique UTR enforcement.
8. Google Sheets Sync writes a summarized row.
9. Customer submits payment verification request.
10. Verification Engine matches UTR, amount, transaction type, and status.
11. Approved payments become Verified; failures go to Manual Review.

## Trust Boundaries

- Gmail OAuth tokens are sensitive secrets and must never reach the frontend.
- OpenAI receives only email content needed for extraction and only after whitelist filtering.
- Payment screenshots are untrusted user uploads and must be validated before storage.
- Admin APIs require authentication and role authorization.
- Database uniqueness and transactions protect against duplicate UTR verification.

## Configuration-Driven Banks

Supported banks are modeled as configuration records:

- Bank display name
- Allowed sender email addresses
- Transaction keywords
- Optional parser patterns
- Enabled flag

This enables adding future banks without changing the core processing pipeline.

## Reliability Requirements

- Gmail polling must be idempotent.
- Database writes must handle duplicate UTR safely.
- Google Sheets sync must support retry without duplicate rows.
- Verification status changes must be transactional.
- Processing errors must not stop future polling cycles.

## Observability Requirements

- Log rejected email reason without storing irrelevant email content.
- Log parsing confidence and AI fallback usage.
- Track Gmail polling success, failures, latency, and processed message counts.
- Track verification approvals, manual reviews, and duplicate attempts.
- Emit deployment logs suitable for CloudWatch.


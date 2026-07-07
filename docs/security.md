# Security Model

## Email Processing Controls

- Reject all non-whitelisted senders before parsing.
- Reject non-transaction emails before AI parsing.
- Never call OpenAI for ignored emails.
- Never write ignored email content to the database.
- Store rejection metrics without storing unrelated email bodies.

## Secret Handling

The following values must be environment variables only:

- Gmail OAuth client ID and secret
- Gmail OAuth refresh token
- Google Sheets credentials
- OpenAI API key
- JWT signing secret
- Database URL
- Encryption keys

Gmail tokens must never be exposed through frontend APIs, logs, exports, screenshots, or admin views.

## Data Protection

- Encrypt sensitive stored tokens and customer-upload metadata.
- Use HTTPS in production.
- Restrict CORS to approved frontend origins.
- Validate every API input.
- Use Prisma parameterized queries to prevent SQL injection.
- Use rate limiting on authentication, verification, and upload routes.
- Validate uploaded payment screenshot MIME type and size.

## Access Control

Planned roles:

- `Admin`: full dashboard access, manual review, exports, configuration.
- `Reviewer`: manual review and transaction lookup.
- `Viewer`: read-only dashboard access.
- `Customer`: payment verification submission only.

## Auditability

The system should record:

- Verification decisions
- Manual review decisions
- Admin user actions
- Duplicate UTR attempts
- Parser confidence and fallback source
- Google Sheets sync failures and retries

## Failure Behavior

- If Gmail polling fails, retry on the next polling interval.
- If parsing fails, store the candidate in Manual Review only if it came from a whitelisted bank sender.
- If PostgreSQL persistence fails, do not sync to Google Sheets.
- If Google Sheets sync fails, keep PostgreSQL as the source of truth and retry sync.
- If verification matching is ambiguous, move to Manual Review.


# Security Policy

## Supported Scope

Security controls are designed around a narrow email ingestion policy:

- Only Gmail Inbox emails are considered.
- Only approved bank sender emails are eligible.
- Only transaction notification emails are parsed.
- All other emails are ignored.

## Reporting Security Issues

Do not include secrets, OAuth tokens, raw payment screenshots, or full customer records in issue reports.

When reporting a security concern, include:

- Affected component
- Reproduction steps
- Expected behavior
- Actual behavior
- Logs with sensitive values redacted

## Secret Rules

- Do not commit `.env`.
- Do not log Gmail tokens.
- Do not expose Gmail OAuth data to the frontend.
- Do not send ignored emails to OpenAI.
- Do not store unrelated email body content.


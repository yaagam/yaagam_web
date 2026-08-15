# DPDP deployment requirements

The web client supports purpose-separated optional-cookie choices, collection notices, consent-gated third-party media, and a Privacy Centre at `/privacy-centre`.

This repository alone cannot establish legal compliance. Production release must be blocked until the following controls are implemented and evidenced.

## Required backend contracts

### `POST /privacy/requests`

- Authenticate the current account using the secure session cookie.
- Accept only `ACCESS`, `CORRECTION`, `ERASURE`, `WITHDRAW_CONSENT`, `ACCOUNT_DELETION`, `NOMINATION`, or `GRIEVANCE`.
- Validate `details` as plain text between 10 and 2,000 characters and `preferredLanguage` against supported languages.
- Create a tamper-evident reference, received timestamp, statutory due date, status and audit history.
- Require proportionate identity/authority verification before disclosure or mutation.
- Never return raw internal records; return only `{ reference, status }`.
- Rate limit requests and prevent account enumeration.
- Route grievances to the published grievance officer and record resolution/escalation.
- Apply erasure across primary data, processors, search indexes and scheduled backups, subject to documented legal holds.

### `POST /privacy/consents`

- Record authenticated account ID when available, notice version, exact purpose choices, source, server timestamp, withdrawal history and evidence of the presented notice.
- Treat every purpose independently. Refusal or withdrawal must not affect necessary service processing.
- Do not activate optional processing unless the record succeeds; reconcile anonymous consent after login without creating advertising identifiers.
- Retain consent evidence only for the documented limitation/defence period, then securely erase it.

## Organizational evidence required

- A data inventory mapping every field to purpose, lawful ground, processor, storage location, recipient and retention period.
- Published, translated, independently understandable notices for each collection point and notices for data collected before commencement.
- Processor agreements with temples, priests, couriers, Razorpay, messaging, hosting, analytics and advertising providers; approved subprocessors and deletion duties.
- A board-approved retention schedule enforced by automated jobs and verified against backups.
- Security controls including least privilege, MFA for privileged access, encryption in transit and at rest, key rotation, vulnerability management, audit logging and periodic testing.
- A personal-data breach runbook covering containment, evidence, affected-person notices and Data Protection Board notifications required by the Rules.
- A child-data decision: block under-18 use, or implement verifiable parental consent and prohibit tracking, behavioural monitoring and targeted advertising.
- A nomination workflow and verified representative process.
- Cross-border transfer inventory checked against government restrictions.
- Significant Data Fiduciary controls if notified: India-based DPO, independent auditor, DPIAs and periodic audits.
- Training, grievance ownership, request SLAs, incident exercises and retained compliance evidence.

## Release gate

Legal/DPO sign-off must confirm the deployed system and actual operations, not only policy wording. Do not market the service as “fully DPDP compliant” until every applicable control above has an owner, evidence, test result and review date.

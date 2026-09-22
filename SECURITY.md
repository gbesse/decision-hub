# Security policy

## Supported versions

The latest tagged release and the current `main` branch receive security
fixes. DecisionHub is an alpha deployment and has not received an independent
security audit.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository. If it is not
available, contact the repository owner privately through the contact method
on their GitHub profile. Do not open a public issue for tenant isolation,
authentication, credential handling or share-link bypass findings.

Include the affected version, deployment shape, minimal reproduction, expected
boundary and observed impact. Remove real credentials and personal data. You
should receive an acknowledgement within seven days.

## Security boundary

Production identity is trusted only when the hosting platform strips incoming
identity headers and injects `oai-authenticated-user-id`. Do not expose the
Worker directly or forward that header from an untrusted proxy. Self-hosting
requires an identity gateway that overwrites, rather than preserves, client
headers.

Jev keys are request-scoped secrets. They must not be persisted, cached or
logged. Aggregate links are capability URLs but remain subject to Site access;
they omit original inputs and answers and can be revoked by their owner.

The local preview has a synthetic single-user identity and loopback binding.
It is suitable for functional tests, not for validating production
authentication or tenant isolation at the edge.

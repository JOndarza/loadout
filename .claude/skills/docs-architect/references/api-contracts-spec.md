# api-contracts.md Spec

Structure: group endpoints by domain/controller. For **each endpoint** include:
- **HTTP method + path** (e.g., `POST /api/v1/users`)
- **Description** — one sentence explaining what it does
- **Authentication** — which filter/attribute/middleware, which header (e.g., `X-Api-Key`, `Authorization: Bearer`), which config key provides the value
- **Request headers** — all required headers with example values
- **Request body** — full JSON example with field types and constraints (required/optional, min/max length, format). Use realistic data, not "string" placeholders
- **Response body (success)** — full JSON example with HTTP status code (200, 201, 204, etc.)
- **Response body (error)** — Problem Details JSON example for each possible error, with HTTP status code and error code
- **Error codes table** — which exceptions map to which HTTP status for this endpoint
- **Rate limiting** (if different from default) — requests per window
- **Notes** — versioning info, deprecation warnings, special behaviors

Also include at the top:
- **Base URL** per environment (dev, staging, prod)
- **API versioning strategy** — how version is specified (URL segment, header, both)
- **Common headers** — headers required on all requests
- **Common error format** — Problem Details (RFC 7807) structure with example
- **Authentication summary** — table: auth type, header, config key, which endpoint groups use it

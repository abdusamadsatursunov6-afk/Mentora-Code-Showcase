# Public Architecture Overview

Mentora uses a modular web-and-API architecture.

## Web client

The published Next.js client is organised by application route. Shared concerns
such as authentication state, multilingual content, typed API access, and lesson
autosave live in `apps/web/lib`. Reusable components are provided through the
`packages/ui` workspace, while API contracts are shared through
`packages/shared-types`.

## Private API

The production API is a FastAPI modular monolith backed by PostgreSQL and
Alembic migrations. Its modules cover identity, onboarding, lessons,
assessments, classes, students, quiz sessions, homework, curriculum materials,
exports, and analytics.

## AI layer

The AI layer is provider-independent. Requests are mapped to explicit schemas,
validated before storage, and recorded for auditability. Production prompts,
provider configuration, and model credentials are intentionally excluded from
this public evaluation repository.

## Data flow

1. A teacher enters the subject, grade, topic, language, and lesson settings.
2. The web client sends a typed request to the API.
3. The API validates access and orchestrates lesson generation.
4. Structured output is validated and persisted as an editable lesson.
5. The teacher edits, autosaves, creates assessments, and exports materials.
6. Student evidence from quizzes and homework appears in teacher analytics.

## Security boundaries

- Access and refresh tokens are handled by the private API.
- Production secrets are supplied only through deployment environment variables.
- The web client contains no database credentials or AI provider keys.
- Personal and student data are not included in this repository.

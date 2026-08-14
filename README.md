# Mentora — Public Code Showcase

Mentora is an AI-powered educational platform for teachers, mentors, schools,
and learning centres in Uzbekistan. It brings lesson planning into one digital
workspace and generates a coherent lesson package from a teacher's inputs.

This repository is a curated, security-reviewed excerpt of the Mentora pilot
MVP source code prepared for the **President Tech Award 2026** evaluation. The
complete production repository remains private.

## Live product

- MVP: https://mentoraedu.uz/
- Project video: https://drive.google.com/file/d/1lUhNi7ulUexv6wEKoChx92Jm6SpULzHb/view?usp=drivesdk

## Product capabilities

- One-click generation of a complete lesson draft
- Theory, practice, assessment, homework, and presentation in one workflow
- Separate lesson, presentation, and assignment languages
- Russian, Uzbek, and English support
- Curriculum alignment and source-grounded generation
- Classes, students, QR-based quizzes, and teacher analytics
- Editing, autosave, version history, and export workflows

## Technology

- **Web:** Next.js, React, TypeScript
- **API:** FastAPI, Python, Pydantic
- **Data:** PostgreSQL, SQLAlchemy, Alembic
- **AI layer:** provider-independent gateway with schema validation and audit records
- **Quality:** Vitest and Pytest test suites

## Code map

- `apps/api/app/modules/ai/` — AI orchestration, validation, evaluation, and gateway logic
- `apps/api/app/modules/lessons/` — lesson domain, versioning, and curriculum-aware workflow
- `apps/api/app/modules/assessment/` — quizzes, questions, options, and homework
- `apps/api/app/modules/analytics/` — teacher-facing learning analytics
- `apps/api/app/core/security/` — password and token security examples
- `apps/web/lib/` — typed API integration and conflict-safe autosave
- `apps/web/components/` — multilingual UI examples
- `packages/` — shared TypeScript contracts and UI components
- `apps/*/__tests__/` — representative automated tests

## Security and scope

No production database, user data, credentials, environment files, API keys,
provider prompts, or deployment secrets are included. This excerpt is intended
for technical evaluation and demonstrates the architecture and engineering
quality of the working pilot MVP.

## Author

Mentora project team, Uzbekistan — 2026.

Copyright © 2026 Mentora. All rights reserved.

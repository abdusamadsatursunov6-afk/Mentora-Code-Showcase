# Mentora — Public Web Client Showcase

Mentora is an AI-powered educational platform for teachers, mentors, schools,
and learning centres in Uzbekistan. It turns a teacher's inputs into a coherent
lesson package that includes learning objectives, theory, practice, assessment,
homework, and a presentation.

This repository contains a **substantial, executable selection from the working
Mentora web client**, shared TypeScript contracts, reusable UI components, and
automated frontend tests. It was prepared for the technical evaluation of the
President AI Award 2026.

## Live product

- MVP: https://mentoraedu.uz/
- Demo video: https://drive.google.com/file/d/1lUhNi7ulUexv6wEKoChx92Jm6SpULzHb/view?usp=drivesdk

## What is included

- Representative Next.js App Router screens from the production web client
- Registration, sign-in, and teacher onboarding
- Teacher dashboard and lesson workspace
- One-click full lesson generation interface
- Lesson editing, autosave, and version-conflict handling
- Classes, students, QR quizzes, and homework flows
- Presentation and assessment workspaces
- Teacher-facing analytics and feedback
- Russian, Uzbek, and English localisation
- Progressive Web App manifest, service worker, and offline page
- Shared UI package and typed API contracts
- Representative automated tests from the validated 35-test frontend suite

## Repository map

```text
apps/web/
  app/                 Next.js routes and application screens
  components/          Authentication, language, and PWA components
  lib/                 API client, session, i18n, and autosave logic
  locales/             English, Russian, and Uzbek translations
  public/              PWA assets
  __tests__/            Vitest and Testing Library test suite
packages/
  shared-types/        Shared TypeScript API contracts
  ui/                  Reusable accessible UI components
  config/              Shared TypeScript and formatting configuration
docs/
  ARCHITECTURE.md      Public architecture overview
  EVALUATION.md        Verification results and test scope
```

## Technology

- Next.js 16, React 19, and TypeScript
- Tailwind CSS and reusable component primitives
- Vitest, Testing Library, ESLint, and Prettier
- Typed REST integration with the private FastAPI backend
- PostgreSQL-backed production API and provider-independent AI gateway

## Local verification

Requirements: Node.js 20+ and npm 10+.

```bash
npm ci
npm run format:check
npm run lint:web
npm run typecheck:web
npm run test:web
npm run build:web
```

To start the web client locally:

```bash
cp .env.example .env
npm run dev:web
```

The public repository does not contain the production backend. Interactive
features that call the API require a compatible local API at
`NEXT_PUBLIC_API_URL`. The complete end-to-end product is available through the
live MVP link above.

## Verification status

The published snapshot was checked on 19 August 2026:

- ESLint: passed with zero warnings
- TypeScript: passed
- Vitest: 35/35 tests passed
- Next.js production build: passed; 14 routes generated

See [docs/EVALUATION.md](docs/EVALUATION.md) for the test coverage summary.

## Security and scope

The production database, backend business logic, AI prompts, provider keys,
deployment secrets, personal data, and environment files are not included. The
repository contains no production credentials. Please report security concerns
privately as described in [SECURITY.md](SECURITY.md).

## Intellectual property

This is a source-available evaluation copy, not an open-source release. See
[LICENSE.md](LICENSE.md).

Copyright © 2026 Mentora. All rights reserved.

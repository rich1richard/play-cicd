# play-cicd

[![Sentinel](https://github.com/rich1richard/play-cicd/actions/workflows/sentinel.yml/badge.svg)](https://github.com/rich1richard/play-cicd/actions/workflows/sentinel.yml)

A CI/CD reference implementation: Playwright end-to-end and API tests, running on a GitHub Actions matrix (Ubuntu, Windows, macOS), gated by browser-binary caching, feeding a mock production deploy job.

**Why this repo exists:** it's a fork-and-adapt template demonstrating a testing/CI pipeline I can build for client projects. The target under test is a public demo store ([automationexercise.com](https://www.automationexercise.com)), so the whole pipeline is runnable by anyone without extra setup, but the parts worth looking at are in `.github/workflows/sentinel.yml`: a cross-platform test matrix, dependency/browser caching keyed per OS, and a `deploy-production` job that only fires after every test job succeeds on `main`.

## What the pipeline does

On every push/PR to `main` (or `master`), the [Sentinel workflow](.github/workflows/sentinel.yml) runs three jobs:

- **test-staging** — runs the UI test suite (`test.spec.ts`) across a matrix of Ubuntu, Windows, and macOS runners, using Chromium, Firefox, and mobile viewport emulation (WebKit/Mobile Safari on non-Windows runners only).
- **test-api** — runs the API test suite (`api.spec.ts`) against the same target.
- **deploy-production** — a stand-in deploy step that only runs once `test-staging` and `test-api` both succeed, and only on `main`.

Playwright browser binaries are cached per-OS (keyed on the `package-lock.json` hash) so most runs skip the browser download and only reinstall system dependencies. HTML reports are uploaded as build artifacts for every OS/job combination.

## Setup

```bash
npm ci
npx playwright install --with-deps
```

Create a `.env` file (or set the equivalent secrets in your GitHub repo settings) with credentials for an account on the target site:

```
BASE_URL=https://www.automationexercise.com
USER_EMAIL=your-account-email
USER_PASSWORD=your-account-password
```

In CI these are read from `secrets.USER_EMAIL` and `secrets.USER_PASSWORD` (see `sentinel.yml`).

## Running tests locally

```bash
npx playwright test test.spec.ts   # UI suite
npx playwright test api.spec.ts    # API suite
npx playwright show-report         # view the last HTML report
```

## Notes

[`github-actions-notes.md`](github-actions-notes.md) has a plain-language rundown of GitHub Actions concepts (workflows, jobs, matrices, caching) as used in this repo — useful if you're new to Actions and want the reasoning behind the YAML.

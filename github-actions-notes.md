# GitHub Actions Notes

> They are automated processes (`*.yaml`) saved inside `.github/workflows/`

The logic is one **workflow** has many **jobs** of many **steps**, with many **runs** triggered by various **events**.

- A **Workflow** is a configurable automated process with many jobs

- An **Event** is an activity on the repo that triggers the workflow

- A **Job** is a set of steps in the workflow meant to execute a specific task

- An **Action** is a pre-made set of jobs/code that can be reused via `uses: ...`

- A **Run** is an execution of a workflow, each job being executed by one **Runner** (ubuntu, windows, macOS).

### Useful Variables & functions

It is used in `${{ ... }}`:
- `secrets.VARIABLE`: the secret variable configured in GitHub.
- `runner.os`: the OS that is running the workflow.
- `matrix.FIELD`: the current value of a matrix axis (e.g. `matrix.os`).
- `steps.STEP_ID.outputs.OUTPUT_VAR`: to get the output.
  `...cache-hit`: if the cache was found.
- `github.ref`: the branch/tag ref that triggered the run (e.g. `refs/heads/main`).
- `needs.JOB_ID.result`: the result of a job this job depends on.
######
- `cancelled()`: if the workflow run is cancelled.
- `success()`: if all previous steps/jobs succeeded (default condition, useful to combine with an extra check, e.g. `success() && github.ref == 'refs/heads/main'`).
- `hashfile(FILEPATH)`: to get the hash of a file.

### Basic Workflow

```yml
name: Test # the name of the workflow

on: # the triggers (events to listen to)
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]

jobs:
  hello: # the name of the job
    runs-on: ubuntu-latest # defines the system to use: ubuntu, windows, macOS

    steps:
    - uses: actions/checkout@v6 # a github action to checkout a branch
      with: # set parameters
        node-version: lts/*
        cache: "npm"

    - name: Run hello command
      run: echo "Hello World" # to execute a command
```

####

### Defining a strategy matrix

The matrix belongs to the job, and `runs-on` should point at the matrix axis
you want to run on (not the other way around, and `strategy`/`matrix` are
reserved keys, not the job's name):

```yml
jobs:
  test-staging:
    strategy:
      fail-fast: false # keep running the other OS jobs even if one fails
      matrix:
        os: [ ubuntu-latest, windows-latest, macos-latest ]

    runs-on: ${{ matrix.os }}
```

A step can also be skipped/branched per matrix value, e.g. to exclude a
browser on a given OS:

```yml
- name: Install Playwright browsers (Windows)
  if: matrix.os == 'windows-latest'
  run: npx playwright install chromium firefox --with-deps
```

### Caching folders

Cache one path per OS when the matrix runs on several runners (each OS keeps
its own cache, keyed on `runner.os` + the lockfile hash):

```yml
- name: Cache Playwright browsers
  id: cache-playwright
  uses: actions/cache@v5
  with:
    path: |
      ~/.cache/ms-playwright
      ~\AppData\Local\ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      playwright-${{ runner.os }}-
```

Use the cache step's `id` + `outputs.cache-hit` to skip reinstalling browsers
when the cache already has them, and only reinstall their system
dependencies:

```yml
- name: Install Playwright browsers
  if: steps.cache-playwright.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps

- name: Install Playwright browsers dependencies
  if: steps.cache-playwright.outputs.cache-hit == 'true'
  run: npx playwright install-deps
```

### Job dependencies & conditions

A job can wait on other jobs with `needs`, and only run under a condition
(e.g. only deploy from `main`, once tests passed):

```yml
jobs:
  deploy-production:
    needs: [test-staging, test-api]
    runs-on: ubuntu-latest
    if: success() && github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: echo "Deploying to production..."
```

### Uploading artifacts

Upload files produced by a run (e.g. a test report) so they can be
downloaded from the run summary. Name them uniquely per matrix leg so
parallel OS runs don't overwrite each other's artifact, and upload them even
if a test step failed (just not if the run was cancelled):

```yml
- uses: actions/upload-artifact@v6
  if: ${{ !cancelled() }}
  with:
    name: ${{ runner.os }}-staging-report
    path: playwright-report/
    retention-days: 7
```

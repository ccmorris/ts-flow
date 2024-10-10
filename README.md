# ts-flow

> Workflow orchestration in TypeScript

## Status

This package is a work in progress and not yet published. Expect breaking changes.

## Usage

Install bun: <https://bun.sh>

Install dependencies:

```bash
bun install
```

Run test:

```bash
bun test
```

## Todo

- Shared context data between tasks
- Workflow linter: ensures the activity function inputs/outputs are typed safely
- Expand README with more docs and examples
- Publish package
- Github Actions
- Plugin to store shared context data in a datastore

## Features

- Declarative or imperative syntax
- Generate an image for the workflow (via mermaid)
- Choice activities for more complex workflows

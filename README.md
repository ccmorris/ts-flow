# ts-flow

> Workflow orchestration in TypeScript

## Status

This package is a work in progress and not yet published. Expect breaking changes.

## Usage

```ts
const start = new Activity('activity1', () => {})
const workflow = start
  .catch('Timeout', null)
  .then(new Choice('choice1', () => {}))
  .choice('option1', new Activity('activity2', () => {}))
  .choice('option2', null)

const result = await start.run('initial input', { val: 'initial context' })

const workflowOutput = result.output
const workflowDiagram = toMermaidPngUrl(start.toTaskDefinitions(), result)
```

## Development

Install bun: <https://bun.sh>

Install dependencies:

```bash
bun install
```

Run tests:

```bash
bun test
```

## Todo

- Run a workflow using the chained output: eg. .run on the last task should start from the beginning
- Expand README with more docs and examples
- Write instructions for setting up automatic retries on AWS
- Expand comments and docstrings
- Publish package
- Github Actions
- Improved type safety for context data: consider an input type generic from the run method and/or constructors
- Measure the time for each task
- Timeout handling
  - Set a max timeout value
  - Cancellable tasks using an AbortSignal?

## Features

- Type safety for function inputs/outputs
- Declarative or imperative syntax
- Generate an image for the workflow (via mermaid diagram syntax)
- Generate an image for a traced workflow to show the path taken
- Choice activities for more complex workflow decisions
- Shared context data between tasks
- Zero dependencies

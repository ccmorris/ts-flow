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

Run tests:

```bash
bun test
```

## Todo

- Expand README with more docs and examples
- Write instructions for setting up automatic retries on AWS
- Expand comments and docstrings
- Publish package
- Github Actions
- Improved type safety for context data: consider an input type generic from the run method and/or constructors
- Debugging tools:
  - Trace the steps that a workflow execution takes
  - Visualize a workflow trace with an image (via mermaid diagram syntax)
  - Wrap the errors to include additional details including step name and trace data, with toString toJson toObject
  - Return a trace on successful workflows
  - Measure the time for each task
- Timeout handling
  - Set a max timeout value
  - Cancellable tasks using an AbortSignal?

## Features

- Type safety for function inputs/outputs
- Declarative or imperative syntax
- Generate an image for the workflow (via mermaid diagram syntax)
- Choice activities for more complex workflow decisions
- Shared context data between tasks
- Zero dependencies

# ts-workflow

> Workflow orchestration in TypeScript

`npm i ts-workflow` | `bun i ts-workflow`

## Features

- Type safety for function inputs/outputs
- Choice activities for more complex workflow decisions
- Shared context data between tasks
- Zero dependencies
- Generate an image for the workflow (via mermaid diagram syntax)
- Generate an image for a traced workflow to show the path taken

## Usage

Example:

```ts
import { Activity, Choice, Workflow } from 'ts-workflow'

const startTask = new Activity('activity1', async () => {})
const workflow = new Workflow({ startTask })
startTask
  .catch('Timeout', null)
  .then(new Choice('choice1', async () => {}))
  .choice('option1', new Activity('activity2', async () => {}))
  .choice('option2', null)

const result = await workflow.run('initial input', { val: 'initial context' })

const workflowOutput = result.output
const workflowDiagram = workflow.toPngUrl(result)
```

### Steps

1. Define a starting task by creating a new Activity or a new Choice
2. Create a workflow using the starting task
3. Chain the remaining tasks using `.catch`, `.then`, and `.choice`
4. Run the workflow with an initial input and an initial context
5. (Optional) Log the workflow final output, and the traced workflow diagram

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

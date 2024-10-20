import type { Activity } from './Activity'
import type { Choice } from './Choice'
import { toDiagramPngUrl, toMermaid } from './diagrams'
import { run } from './run'
import type { WorkflowResult } from './types'

export type Task<I, O> = Activity<I, O> | Choice<I, O>

export class Workflow<I> {
  startTask: Task<I, any>

  constructor({ startTask }: { startTask: Task<I, any> }) {
    this.startTask = startTask
  }

  public async run(initialInput: I): Promise<WorkflowResult> {
    return run(this.startTask.toTaskDefinitions(), initialInput)
  }

  public toMermaid(): string {
    return toMermaid(this.startTask.toTaskDefinitions())
  }
  public toPngUrl(workflowResult?: WorkflowResult): string {
    return toDiagramPngUrl(this.startTask.toTaskDefinitions(), workflowResult)
  }
}

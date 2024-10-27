import type { Activity } from './Activity'
import type { Choice } from './Choice'
import { toDiagramPngUrl, toMermaid } from './diagrams'
import { run } from './run'
import type { ActivityContext, WorkflowResult } from './types'

export type Task<I, O, C extends ActivityContext> =
  | Activity<I, O, C>
  | Choice<I, O, C>

/**
 * A workflow is a collection of tasks that can be run together.
 *
 * The workflow can be run from the starting task with an initial input and initial context.
 */
export class Workflow<I, C extends ActivityContext> {
  startTask: Task<I, any, C>

  constructor({ startTask }: { startTask: Task<I, any, C> }) {
    this.startTask = startTask
  }

  /**
   * Run the workflow with an initial input and initial context.
   */
  public async run(
    initialInput: I,
    initialContext: C
  ): Promise<WorkflowResult> {
    return run(this.startTask.toTaskDefinitions(), initialInput, initialContext)
  }

  /**
   * Convert the workflow to a Mermaid diagram definition.
   */
  public toMermaid(): string {
    return toMermaid(this.startTask.toTaskDefinitions())
  }

  /**
   * Convert the workflow to a PNG image URL.
   * Provide a workflow result to highlight the path taken in the diagram.
   */
  public toPngUrl(workflowResult?: WorkflowResult): string {
    return toDiagramPngUrl(this.startTask.toTaskDefinitions(), workflowResult)
  }
}

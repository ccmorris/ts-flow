import type { Activity } from './Activity'
import type { Choice } from './Choice'
import { toDiagramPngUrl, toMermaid } from './diagrams'
import { run } from './run'
import type { WorkflowResult } from './types'

export type Task<I, O> = Activity<I, O> | Choice<I, O>

/**
 * A workflow is a collection of tasks that can be run together.
 *
 * The workflow can be run from the starting task with an initial input and initial context.
 */
export class Workflow<I> {
  startTask: Task<I, any>

  constructor({ startTask }: { startTask: Task<I, any> }) {
    this.startTask = startTask
  }

  /**
   * Run the workflow with an initial input and initial context.
   */
  public async run(
    initialInput: I,
    initialContext: Record<string, unknown> = {}
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

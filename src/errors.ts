import { toMermaidPngUrl } from './mermaid'
import type { TaskDefinitions, WorkflowResult } from './types'

export class WorkflowError extends Error {
  originalError?: Error
  workflowResult?: WorkflowResult

  private tasks?: TaskDefinitions

  constructor(
    message: string,
    originalError?: Error,

    workflowResult?: WorkflowResult,
    tasks?: TaskDefinitions
  ) {
    super(message)
    this.name = 'WorkflowError'
    this.originalError = originalError
    this.workflowResult = workflowResult
    this.tasks = tasks
  }

  toJson(): string {
    return JSON.stringify({
      message: this.message,
      originalError: this.originalError,
    })
  }

  toDiagramPng(): string | null {
    if (!this.tasks || !this.workflowResult) {
      return null
    }
    return toMermaidPngUrl(this.tasks, this.workflowResult)
  }
}

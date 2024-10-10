import type { TaskDefinitions, ActivityFunction, EndPointer } from './types'
import { run } from './run'
import { toMermaid } from './mermaid'
import type { Activity } from './Activity'

export class Choice {
  name: string
  start: boolean
  fn: ActivityFunction
  choices: { [key: string]: Activity | Choice | EndPointer }

  public constructor(
    name: string,
    fn: ActivityFunction,
    config: { start?: true } = {}
  ) {
    this.name = name
    this.start = config.start ?? true
    this.fn = fn
    this.choices = {}
  }

  public choice(name: string, next: Activity | Choice | EndPointer) {
    this.choices = { ...this.choices, [name]: next }
    return this
  }

  public toTaskDefinitions(): TaskDefinitions {
    const tasks = [
      {
        type: 'choice' as const,
        name: this.name,
        start: this.start ? (true as const) : undefined,
        fn: this.fn,
        choices: this.choices
          ? Object.fromEntries(
              Object.entries(this.choices).map(([key, choiceTask]) => {
                return [key, choiceTask?.name ?? null]
              })
            )
          : {},
      },
      ...(this.choices
        ? Object.values(this.choices)
            .map((choice) => choice?.toTaskDefinitions())
            .filter((task) => !!task)
            .flat()
        : []),
    ]
    return removeDuplicateTasks(tasks)
  }

  public async run(initialInput: unknown) {
    if (!this.start) throw new Error('Task must be a start task')
    await run(this.toTaskDefinitions(), initialInput)
  }

  public toMermaid(): string {
    return toMermaid(this.toTaskDefinitions())
  }
}

// removes duplicates from an array using the name property
const removeDuplicateTasks = (tasks: TaskDefinitions) => {
  const seen = new Set()
  return tasks.filter((task) => {
    if (seen.has(task.name)) return false
    seen.add(task.name)
    return true
  })
}

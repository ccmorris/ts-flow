import type { TaskDefinitions, ActivityFunction, EndPointer } from './types'
import { run } from './run'
import { toMermaid } from './mermaid'
import type { Choice } from './Choice'

export class Activity {
  name: string
  start: boolean
  fn: ActivityFunction
  next?: Activity | Choice | EndPointer
  catchConfig?: { [key: string]: { then: Activity | Choice | EndPointer } }

  public constructor(
    name: string,
    fn: ActivityFunction,
    config: { start?: true } = {}
  ) {
    this.name = name
    this.start = config.start ?? true
    this.fn = fn
  }

  public then<T extends Activity | Choice>(next: T): T {
    next.start = false
    this.next = next
    return next
  }

  public catch(error: string, next: Activity | Choice | EndPointer) {
    if (next) next.start = false
    this.catchConfig = { ...this.catchConfig, [error]: { then: next } }
    return this
  }

  public toTaskDefinitions(): TaskDefinitions {
    const tasks = [
      {
        type: 'activity' as const,
        name: this.name,
        start: this.start ? (true as const) : undefined,
        fn: this.fn,
        then: this.next?.name ?? null,
        catch: this.catchConfig
          ? Object.fromEntries(
              Object.entries(this.catchConfig).map(([error, catchTask]) => {
                return [error, { then: catchTask.then?.name ?? null }]
              })
            )
          : undefined,
      },
      ...(this.next ? this.next.toTaskDefinitions() : []),
      ...(this.catchConfig
        ? Object.values(this.catchConfig)
            .map((catchTask) => catchTask.then?.toTaskDefinitions())
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

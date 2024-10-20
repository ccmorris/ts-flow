import type {
  TaskDefinitions,
  ActivityFunction,
  EndPointer,
  CatchInput,
} from './types'
import type { Choice } from './Choice'

export class Activity<I, O> {
  name: string
  fn: ActivityFunction<I, O>
  next?: Activity<O, unknown> | Choice<O, unknown> | EndPointer
  catchConfig?: {
    [key: string]: {
      then:
        | Activity<CatchInput<any>, unknown>
        | Choice<CatchInput<any>, unknown>
        | EndPointer
    }
  }

  public constructor(name: string, fn: ActivityFunction<I, O>) {
    this.name = name
    this.fn = fn
  }

  public then<T extends Activity<O, any> | Choice<O, any>>(next: T): T {
    this.next = next
    return next
  }

  public catch<CatchKey extends string>(
    error: CatchKey,
    next:
      | Activity<CatchInput<CatchKey>, any>
      | Choice<CatchInput<CatchKey>, any>
      | EndPointer
  ) {
    this.catchConfig = { ...this.catchConfig, [error]: { then: next } }
    return this
  }

  public toTaskDefinitions(): TaskDefinitions {
    const tasks = [
      {
        type: 'activity' as const,
        name: this.name,
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
    return removeDuplicateTasks(tasks as TaskDefinitions)
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

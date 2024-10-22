import type {
  TaskDefinitions,
  ActivityFunction,
  EndPointer,
  CatchInput,
} from './types'
import type { Choice } from './Choice'

/**
 * An activity is a single unit of work in a workflow.
 * Define an async function, and chain activities together to create a workflow.
 */
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

  /**
   * Chain another activity or choice to run after this one, when successful.
   */
  public then<T extends Activity<O, any> | Choice<O, any>>(next: T): T {
    this.next = next
    return next
  }

  /**
   * Chain a catch activity or choice to run after this one, when an error occurs.
   *
   * @example Catch an ErrorName and run an activity:
   * activity.catch('ErrorName', new Activity('activity', async () => {}))
   *
   * @example Catch an ErrorName and end the workflow as a success:
   * activity.catch('ErrorName', null)
   */
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

  /**
   * Convert the activity and any chained activities to a list of task definitions.
   */
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

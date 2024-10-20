import type { TaskDefinitions, ActivityFunction, EndPointer } from './types'
import type { Activity } from './Activity'

export class Choice<I, O> {
  name: string
  fn: ActivityFunction<I, O>
  choices: {
    [key: string]: Activity<I, any> | Choice<I, any> | EndPointer
  }

  public constructor(name: string, fn: ActivityFunction<I, O>) {
    this.name = name
    this.fn = fn
    this.choices = {}
  }

  public choice(
    name: string,
    next: Activity<I, any> | Choice<I, any> | EndPointer
  ) {
    this.choices = { ...this.choices, [name]: next }
    return this
  }

  public toTaskDefinitions(): TaskDefinitions {
    const tasks = [
      {
        type: 'choice' as const,
        name: this.name,
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

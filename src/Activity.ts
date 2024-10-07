import type { ActivityDefinitions, ActivityFunction, EndPointer } from './types'
import { run } from './run'
import { toMermaid } from './mermaid'

export class Activity {
  name: string
  start: boolean
  fn: ActivityFunction
  next?: Activity | EndPointer
  catchConfig?: { [key: string]: { then: Activity | EndPointer } }

  public constructor(
    name: string,
    fn: ActivityFunction,
    config: { start?: true } = {}
  ) {
    this.name = name
    this.start = config.start ?? true
    this.fn = fn
  }

  public then(next: Activity) {
    next.start = false
    this.next = next
    return next
  }

  public catch(error: string, next: Activity | EndPointer) {
    if (next) next.start = false
    this.catchConfig = { ...this.catchConfig, [error]: { then: next } }
    return this
  }

  public toActivityDefinitions(): ActivityDefinitions {
    const activities = [
      {
        name: this.name,
        start: this.start ? (true as const) : undefined,
        fn: this.fn,
        then: this.next?.name ?? null,
        catch: this.catchConfig
          ? Object.fromEntries(
              Object.entries(this.catchConfig).map(([error, catchActivity]) => {
                return [error, { then: catchActivity.then?.name ?? null }]
              })
            )
          : undefined,
      },
      ...(this.next ? this.next.toActivityDefinitions() : []),
      ...(this.catchConfig
        ? Object.values(this.catchConfig)
            .map((catchActivity) => catchActivity.then?.toActivityDefinitions())
            .filter((activity) => !!activity)
            .flat()
        : []),
    ]
    return removeDuplicateActivities(activities)
  }

  public async run(initialInput: unknown) {
    if (!this.start) throw new Error('Activity must be a start activity')
    await run(this.toActivityDefinitions(), initialInput)
  }

  public toMermaid(): string {
    return toMermaid(this.toActivityDefinitions())
  }
}

// removes duplicates from an array using the name property
const removeDuplicateActivities = (activities: ActivityDefinitions) => {
  const seen = new Set()
  return activities.filter((activity) => {
    if (seen.has(activity.name)) return false
    seen.add(activity.name)
    return true
  })
}

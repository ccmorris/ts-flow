export type ActivityPointer = string
export type EndPointer = null

export type CatchDefinition = {
  [key: string]: {
    then: ActivityPointer | EndPointer
  }
}

export type ActivityContext = {
  fail: (error: string) => void
}

export type ActivityFunction = (
  input: unknown,
  context: ActivityContext
) => Promise<unknown> // TODO: more type safe input/output

export type ActivityDefinition = {
  name: string
  start?: true
  fn: ActivityFunction
  then: ActivityPointer | EndPointer
  catch?: CatchDefinition
}

export type ActivityDefinitions = ActivityDefinition[]

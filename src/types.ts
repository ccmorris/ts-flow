export type ActivityPointer = string
export type EndPointer = null

export type CatchDefinition = {
  [key: string]: {
    then: ActivityPointer | EndPointer
  }
}

export type ActivityContext = {
  success: (output: unknown) => void
  fail: (error: string) => void
}

export type ActivityFunction = (
  input: unknown,
  context: ActivityContext
) => Promise<unknown> // TODO: more type safe input/output

export type ActivityDefinition = {
  start?: true
  fn: ActivityFunction
  then: ActivityPointer | EndPointer
  catch?: CatchDefinition
}

export type ActivityDefinitions = Record<string, ActivityDefinition>

export type TaskPointer = string
export type EndPointer = null

export type CatchDefinition = {
  [key: string]: {
    then: TaskPointer | EndPointer
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
  type: 'activity'
  name: string
  start?: true
  fn: ActivityFunction
  then: TaskPointer | EndPointer
  catch?: CatchDefinition
}

export type ChoiceDefinition = {
  type: 'choice'
  name: string
  start?: true
  fn: ActivityFunction
  choices: {
    [key: string]: TaskPointer | EndPointer
  }
}

export type TaskDefinition = ActivityDefinition | ChoiceDefinition

export type TaskDefinitions = TaskDefinition[]

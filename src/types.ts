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

export type ActivityFunction<I = unknown, O = unknown> = (
  I: I,
  context: ActivityContext
) => Promise<O>

export type ActivityDefinition<I = unknown, O = unknown> = {
  type: 'activity'
  name: string
  fn: ActivityFunction<I, O>
  then: TaskPointer | EndPointer
  catch?: CatchDefinition
}

export type CatchInput<Key extends string> = {
  key: Key
  error: unknown
}

export type ChoiceDefinition<I = unknown, O = unknown> = {
  type: 'choice'
  name: string
  fn: ActivityFunction<I, O>
  choices: {
    [key: string]: TaskPointer | EndPointer
  }
}

export type TaskDefinition<I = unknown, O = unknown> =
  | ActivityDefinition<I, O>
  | ChoiceDefinition<I, O>

export type TaskDefinitions = TaskDefinition[]

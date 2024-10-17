import type {
  ActivityDefinition,
  ChoiceDefinition,
  TaskDefinitions,
  WorkflowResult,
} from './types'

const formatTaskId = (name: string): string => name.replaceAll(' ', '_')

export const toMermaid = (
  tasks: TaskDefinitions,
  result?: WorkflowResult
): string => {
  const failedTaskName =
    result?.success === false && result.transitions.at(-1)?.to?.name
  const tasksWithTraced = tasks.map((task) => {
    const tracedTask = result?.transitions?.find((transition) => {
      return transition.from?.name === task.name
    })
    return {
      ...task,
      isTraced: !!tracedTask,
      tracedTaskName: tracedTask?.transitionName,
      isFailed: task.name === failedTaskName,
    }
  })
  const lines = [
    'flowchart TD',
    `Start((start))${result ? ':::traced==>' : '-->'}`,
    ...tasksWithTraced.map((task) => {
      return task.type === 'activity'
        ? activityToMermaid(task)
        : choiceToMermaid(task)
    }),
  ]
  if (result?.success) {
    // Add the traced style to the End node
    lines[lines.length - 1] = `${lines[lines.length - 1]}:::traced`
  }
  if (result) {
    lines.push('classDef traced fill:green,stroke-width:4px;')
  }
  if (result?.success === false) {
    lines.push('classDef failed fill:#cc0000,stroke-width:4px;')
  }
  return `${lines.join('\n    ')}`
}

const activityToMermaid = (
  activity: ActivityDefinition & {
    isTraced: boolean
    tracedTaskName?: string
    isFailed: boolean
  }
): string => {
  const from = `${formatTaskId(activity.name)}[${activity.name}]`
  const className = activity.isFailed
    ? ':::failed'
    : activity.isTraced
    ? ':::traced'
    : ''
  const isTracedPath = activity.tracedTaskName === 'then'
  const isTracedToEnd =
    activity.then === null && activity.tracedTaskName === '(end)'
  const nextArrow = isTracedPath || isTracedToEnd ? '==>' : '-->'
  const nextDestination = activity.then
    ? formatTaskId(activity.then)
    : 'End((end))'
  const next = `${from}${className}${nextArrow}|then|${nextDestination}`

  const catchConfig = activity.catch
    ? Object.entries(activity.catch).map(([error, catchActivity]) => {
        const from = formatTaskId(activity.name)
        const to = formatTaskId(catchActivity.then ?? 'End((end))')
        const isTracedPath = activity.tracedTaskName === error
        const arrow = isTracedPath ? '==>' : '-->'
        return `\n    ${from}${arrow}|catch ${error}|${to}`
      })
    : ''
  return `${next}${catchConfig}`
}

const choiceToMermaid = (
  choice: ChoiceDefinition & {
    isTraced: boolean
    tracedTaskName?: string
    isFailed: boolean
  }
): string => {
  return `${Object.entries(choice.choices)
    .map(([key, target]) => {
      const from = `${formatTaskId(choice.name)}{${choice.name}}`
      const className = choice.isFailed
        ? ':::failed'
        : choice.isTraced
        ? ':::traced'
        : ''
      const isTracedToEnd = target === null && choice.tracedTaskName === '(end)'
      const isTracedPath = choice.tracedTaskName === key || isTracedToEnd
      const arrow = isTracedPath ? '==>' : '-->'
      const destination = formatTaskId(target ?? 'End((end))')
      return `${from}${className}${arrow}|${key}|${destination}`
    })
    .join('\n    ')}`
}

const encodeMermaidLiveState = (
  mermaidString: string,
  theme?: 'dark' | 'light'
): string => {
  const mermaidLiveState = {
    code: mermaidString,
    mermaid: theme ? JSON.stringify({ theme }) : undefined,
    autoSync: true,
    rough: false,
    updateDiagram: true,
  }
  const base64Encoded = Buffer.from(JSON.stringify(mermaidLiveState)).toString(
    'base64'
  )
  return `base64:${base64Encoded}`
}

export const toMermaidLiveEdit = (
  tasks: TaskDefinitions,
  result?: WorkflowResult
): string => {
  const mermaidString = toMermaid(tasks, result)
  const encodedState = encodeMermaidLiveState(mermaidString, 'dark')
  return `https://mermaid.live/edit#${encodedState}`
}
export const toMermaidPngUrl = (
  tasks: TaskDefinitions,
  result?: WorkflowResult
): string => {
  const mermaidString = toMermaid(tasks, result)
  const encodedState = encodeMermaidLiveState(mermaidString)
  return `https://mermaid.ink/img/${encodedState}?type=png`
}

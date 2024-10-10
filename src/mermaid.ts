import type {
  ActivityDefinition,
  ChoiceDefinition,
  TaskDefinitions,
} from './types'

const formatTaskName = (name: string): string => name.replaceAll(' ', '_')

export const toMermaid = (tasks: TaskDefinitions): string => {
  return `flowchart TD
    Start((start))-->
    ${tasks
      .map((task) => {
        return task.type === 'activity'
          ? activityToMermaid(task)
          : choiceToMermaid(task)
      })
      .join('\n    ')}`
}

const activityToMermaid = (activity: ActivityDefinition): string => {
  const next = activity.then
    ? `-->|then|${formatTaskName(activity.then)}`
    : '-->End((end))'
  const catchConfig = activity.catch
    ? Object.entries(activity.catch).map(([error, catchActivity]) => {
        return `\n    ${formatTaskName(
          activity.name
        )}-->|catch ${formatTaskName(error)}|${formatTaskName(
          catchActivity.then ?? 'End((end))'
        )}`
      })
    : ''
  return `${formatTaskName(activity.name)}${next}${catchConfig}`
}

const choiceToMermaid = (choice: ChoiceDefinition): string => {
  return `${Object.entries(choice.choices)
    .map(
      ([key, target]) =>
        `${formatTaskName(choice.name)}{${
          choice.name
        }}-->|${key}|${formatTaskName(target ?? 'End((end))')}`
    )
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

export const toMermaidLiveEdit = (tasks: TaskDefinitions): string => {
  const mermaidString = toMermaid(tasks)
  const encodedState = encodeMermaidLiveState(mermaidString, 'dark')
  return `https://mermaid.live/edit#${encodedState}`
}
export const toMermaidPngUrl = (tasks: TaskDefinitions): string => {
  const mermaidString = toMermaid(tasks)
  const encodedState = encodeMermaidLiveState(mermaidString)
  return `https://mermaid.ink/img/${encodedState}?type=png`
}

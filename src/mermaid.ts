import type { ActivityDefinitions } from './types'

export const toMermaid = (activities: ActivityDefinitions): string => {
  return `flowchart TD
    Start((start))-->
    ${activities
      .map((activity) => {
        const next = activity.then
          ? `-->|then|${activity.then}`
          : '-->End((end))'
        const catchConfig = activity.catch
          ? Object.entries(activity.catch)
              .map(([error, catchActivity]) => {
                return `-->|catch ${error}|${catchActivity.then}`
              })
              .join('\n')
          : ''
        return `${activity.name}${next}${catchConfig}`
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

export const toMermaidLiveEdit = (activities: ActivityDefinitions): string => {
  const mermaidString = toMermaid(activities)
  const encodedState = encodeMermaidLiveState(mermaidString, 'dark')
  return `https://mermaid.live/edit#${encodedState}`
}
export const toMermaidPngUrl = (activities: ActivityDefinitions): string => {
  const mermaidString = toMermaid(activities)
  const encodedState = encodeMermaidLiveState(mermaidString)
  return `https://mermaid.ink/img/${encodedState}?type=png`
}

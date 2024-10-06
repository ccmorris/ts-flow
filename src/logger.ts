// @internal
export const log = (message: string, metadata?: unknown): void => {
  if (process.env['DEBUG']) {
    console.log(message, metadata)
  }
}

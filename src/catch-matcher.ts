// @internal
export const matchWithWildcards = (pattern: string, text: string): boolean => {
  const startsWithWildcard = pattern.startsWith('*')
  const endsWithWildcard = pattern.endsWith('*')

  // Remove wildcards for exact matching
  const trimmedPattern = pattern.replace(/^\*|\*$/g, '')

  if (startsWithWildcard && endsWithWildcard) {
    // Match substring anywhere
    return text.includes(trimmedPattern)
  } else if (startsWithWildcard) {
    // Match suffix
    return text.endsWith(trimmedPattern)
  } else if (endsWithWildcard) {
    // Match prefix
    return text.startsWith(trimmedPattern)
  } else {
    // Exact match
    return text === trimmedPattern
  }
}

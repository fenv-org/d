/**
 * Converts a value to an array.
 */
export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  return [value]
}

/**
 * Collects an async iterable into an array.
 */
export async function collectAsArray<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const result: T[] = []
  for await (const item of iterable) {
    result.push(item)
  }
  return result
}

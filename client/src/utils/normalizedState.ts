/**
 * This is a function normalized data from array to object
 * @param key name of key you want to convert
 * @param data array original
 * @returns object normalized
 */
export function normalizedState<T = any>(key: keyof T, data: Array<T>):{[id: string]: T} {
  return data.reduce((prevValues, currentValue) => {
    return {...prevValues, [currentValue[key as string]]: currentValue}
  }, {})
}
export const localStorageJSONParse = <R = any>(key: string): R => {
  try {
    const localData = JSON.parse(localStorage.getItem(key));
    return localData as R;
  } catch (error) {
    return undefined;
  }
}

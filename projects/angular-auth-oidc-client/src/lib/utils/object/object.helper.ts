export function removeNullAndUndefinedValues(obj: any): any {
  const copy = { ...obj };
  for (const key in obj) {
    if (obj[key] === undefined || obj[key] === null) {
      delete copy[key];
    }
  }

  return copy;
}

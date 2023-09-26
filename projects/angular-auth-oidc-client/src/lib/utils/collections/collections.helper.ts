export function flattenArray(array: any[][]): any[] {
  return array.reduce(
    (flattened, elem) =>
      flattened.concat(Array.isArray(elem) ? flattenArray(elem) : elem),
    []
  );
}

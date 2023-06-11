export function mockClass<T>(obj: new (...args: any[]) => T): any {
  const keys = Object.getOwnPropertyNames(obj.prototype);
  const allMethods = keys.filter((key) => {
    try {
      return typeof obj.prototype[key] === 'function';
    } catch (error) {
      return false;
    }
  });
  const allProperties = keys.filter((x) => !allMethods.includes(x));

  const mockedClass = class T {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  allMethods.forEach(
    (method) => (mockedClass.prototype[method] = (): void => {})
  );

  allProperties.forEach((method) => {
    Object.defineProperty(mockedClass.prototype, method, {
      get() {
        return '';
      },
      configurable: true,
    });
  });

  return mockedClass;
}

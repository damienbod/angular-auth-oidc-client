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

  allMethods.forEach(
    (method: string) =>
      ((mockedClass.prototype as any)[method] = (): void => {
        return;
      })
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

export function mockProvider<T>(obj: new (...args: any[]) => T): any {
  return {
    provide: obj,
    useClass: mockClass(obj),
  };
}

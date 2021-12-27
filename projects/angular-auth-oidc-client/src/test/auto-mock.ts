export function mockClass<T>(obj: new (...args: any[]) => T) {
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

  allMethods.forEach((method) => (mockedClass.prototype[method] = () => {}));

  allProperties.forEach((method) => {
    Object.defineProperty(mockedClass.prototype, method, {
      get: function () {
        return '';
      },
      configurable: true,
    });
  });

  return mockedClass;
}

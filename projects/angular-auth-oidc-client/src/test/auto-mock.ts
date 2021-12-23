export function createMock<T>(obj: new (...args: any[]) => T): T {
  const res: T = {} as any;

  const keys = Object.getOwnPropertyNames(obj.prototype);
  keys.forEach((key) => {
    res[key] = jasmine.createSpy(key);
  });

  return res;
}

export function mockClass<T>(obj: new (...args: any[]) => T) {
  const keys = Object.getOwnPropertyNames(obj.prototype);

  const mockedClass = class MockedClass {};

  keys.forEach((method) => (mockedClass.prototype[method] = () => {}));

  return mockedClass;
}

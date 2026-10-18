---
name: testing
description: Use when writing, changing, or reviewing unit tests (*.spec.ts) in this repository. Enforces "should ..." test names, testing only through public APIs, and Arrange/Act/Assert comments in every test.
---

# Testing conventions

## 1. Every test name starts with "should"

Each `it(...)` / `test(...)` description must start with `should` and describe the expected behavior.

```ts
// Good
it('should return false when the token is expired', () => { ... });
it('should emit the new auth state after a successful refresh', () => { ... });

// Bad
it('returns false when the token is expired', () => { ... });
it('token expired', () => { ... });
it('calls validateToken', () => { ... });
```

- Describe the observable outcome, not the implementation (`'should reject an id_token with a wrong issuer'`, not `'should call validateIss'`).
- Put the condition in the name when it matters: `'should ... when ...'`.
- `describe(...)` blocks name the unit or method under test (e.g. `describe('isAuthenticated', ...)`) and do not need `should`.
- When touching an existing spec file, rename tests that don't follow this rule in the parts you change.

## 2. Never test private APIs

Test a class only through its public surface — the same API a consumer or collaborator would use.

Do **not**:

- call private or `protected` methods, e.g. `(service as any).doSomething()` or `service['doSomething']()`
- read or write private fields to assert or set up state, e.g. `service['cache'] = ...` or `expect((service as any).isRunning).toBe(true)`
- spy on private methods (`vi.spyOn(service as any, 'privateMethod')`)
- make a member `public` (or drop `private`) only so a test can reach it

Instead:

- Exercise private logic through the public method that uses it, and assert on its return value, emitted values, or calls to injected collaborators (mocked dependencies are fine to spy on — they are public APIs of other units).
- Arrange state through public methods or by configuring mocked dependencies, not by poking fields.
- If private logic is complex enough that it seems to need its own tests, extract it into a separate service/function with a public API and test that.

```ts
// Bad
it('should build the url', () => {
  const url = (service as any).createAuthorizeUrl(config);
  expect(url).toContain('client_id=foo');
});

// Good
it('should build an authorize url containing the client id', async () => {
  // Arrange
  const config = { clientId: 'foo' };

  // Act
  const url = await firstValueFrom(service.getAuthorizeUrl(config));

  // Assert
  expect(url).toContain('client_id=foo');
});
```

## 3. Every test has Arrange / Act / Assert comments

Every test body is split into three phases, each introduced by a comment, with a blank line between phases. This applies to short tests too.

```ts
it('should return false when the token is expired', () => {
  // Arrange
  const token = createExpiredToken();
  vi.spyOn(tokenHelper, 'getTokenExpirationDate').mockReturnValue(pastDate);

  // Act
  const result = service.isTokenValid(token);

  // Assert
  expect(result).toBe(false);
});
```

- **Arrange**: build inputs, configure mocks and spies, and set state through public methods.
- **Act**: run the behaviour under test, ideally one call. If you need several unrelated calls, split the test.
- **Assert**: only `expect(...)` calls, plus whatever is needed to read the result (e.g. awaiting a subscription).
- Use these exact comments (`// Arrange`, `// Act`, `// Assert`) so they are consistent and searchable.
- If there is nothing to arrange (shared setup lives in `beforeEach`), leave out `// Arrange` and keep `// Act` and `// Assert`.
- If act and assert can't be separated, use one `// Act & Assert` comment. Typical cases are `expect(() => fn()).toThrow()`, `await expect(promise).rejects...`, or asserting inside a `subscribe` callback.
- Don't put the phase comments in `beforeEach` / `afterEach` hooks or in helper functions, only in `it` / `test` bodies.
- When touching an existing spec file, add the comments to the tests you change.

## Checklist before finishing

- [ ] Every new or changed test name starts with `should`.
- [ ] No `as any` / bracket access to private members of the unit under test.
- [ ] No spies on private methods.
- [ ] No production visibility changed just for testing.
- [ ] Every new or changed test has `// Arrange`, `// Act`, `// Assert` comments (or `// Act & Assert`).

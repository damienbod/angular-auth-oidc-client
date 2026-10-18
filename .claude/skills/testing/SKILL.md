---
name: testing
description: Use when writing, changing, or reviewing unit tests (*.spec.ts) in this repository. Enforces "should ..." test names and testing only through public APIs.
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
  const url = await firstValueFrom(service.getAuthorizeUrl(config));
  expect(url).toContain('client_id=foo');
});
```

## Checklist before finishing

- [ ] Every new or changed test name starts with `should`.
- [ ] No `as any` / bracket access to private members of the unit under test.
- [ ] No spies on private methods.
- [ ] No production visibility changed just for testing.

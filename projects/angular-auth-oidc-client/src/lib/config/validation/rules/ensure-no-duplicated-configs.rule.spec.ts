import { describe, expect, it } from 'vitest';
import { OpenIdConfiguration } from '../../openid-configuration';
import { ensureNoDuplicatedConfigsRule } from './ensure-no-duplicated-configs.rule';

describe('ensureNoDuplicatedConfigsRule', () => {
  const createConfig = (
    overrides: Partial<OpenIdConfiguration> = {}
  ): OpenIdConfiguration => ({
    authority: 'https://authority',
    clientId: 'clientId',
    scope: 'openid profile',
    ...overrides,
  });

  it('returns an error when a config is not set (passed without a config property)', () => {
    const result = ensureNoDuplicatedConfigsRule([
      null as unknown as OpenIdConfiguration,
    ]);

    expect(result).toEqual({
      result: false,
      messages: [
        `Please make sure you add an object with a 'config' property: ....({ config }) instead of ...(config)`,
      ],
      level: 'error',
    });
  });

  it('returns a warning when two configs share authority, clientId and scope', () => {
    const result = ensureNoDuplicatedConfigsRule([
      createConfig(),
      createConfig(),
    ]);

    expect(result).toEqual({
      result: false,
      messages: [
        'You added multiple configs with the same authority, clientId and scope',
      ],
      level: 'warning',
    });
  });

  it('returns a positive result for distinct configs', () => {
    const result = ensureNoDuplicatedConfigsRule([
      createConfig(),
      createConfig({ clientId: 'clientId2' }),
    ]);

    expect(result).toEqual({
      result: true,
      messages: [],
      level: 'none',
    });
  });
});

import { OpenIdConfiguration } from '../../openid-configuration';
import { useOfflineScopeWithSilentRenew } from './use-offline-scope-with-silent-renew.rule';

describe('useOfflineScopeWithSilentRenew', () => {
  const createConfig = (
    overrides: Partial<OpenIdConfiguration> = {}
  ): OpenIdConfiguration => ({
    silentRenew: true,
    useRefreshToken: true,
    scope: 'openid profile',
    ...overrides,
  });

  it('returns a warning when refresh tokens are used without offline_access', () => {
    const result = useOfflineScopeWithSilentRenew(createConfig());

    expect(result).toEqual({
      result: false,
      messages: [
        'When using silent renew and refresh tokens the `offline_access` scope is often required. If your provider supports this without it, set `disableRefreshTokenOfflineAccessScopeWarning` to suppress this warning.',
      ],
      level: 'warning',
    });
  });

  it('returns a positive result when the warning is disabled explicitly', () => {
    const result = useOfflineScopeWithSilentRenew(
      createConfig({
        disableRefreshTokenOfflineAccessScopeWarning: true,
      })
    );

    expect(result).toEqual({
      result: true,
      messages: [],
      level: 'none',
    });
  });

  it('returns a positive result when offline_access is included', () => {
    const result = useOfflineScopeWithSilentRenew(
      createConfig({
        scope: 'openid profile offline_access',
      })
    );

    expect(result).toEqual({
      result: true,
      messages: [],
      level: 'none',
    });
  });
});

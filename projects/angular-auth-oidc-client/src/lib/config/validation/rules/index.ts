import { ensureAuthority } from './ensure-authority.rule';
import { ensureClientId } from './ensure-clientId.rule';
import { ensureNoDuplicatedConfigsRule } from './ensure-no-duplicated-configs.rule';
import { ensureRedirectRule } from './ensure-redirect-url.rule';
import { ensureSilentRenewUrlWhenNoRefreshTokenUsed } from './ensure-silentRenewUrl-with-no-refreshtokens.rule';
import { useOfflineScopeWithSilentRenew } from './use-offline-scope-with-silent-renew.rule';

export const allRules = [
  ensureAuthority,
  useOfflineScopeWithSilentRenew,
  ensureRedirectRule,
  ensureClientId,
  ensureSilentRenewUrlWhenNoRefreshTokenUsed,
];

export const allMultipleConfigRules = [ensureNoDuplicatedConfigsRule];

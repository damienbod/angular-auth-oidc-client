import { ensureClientId } from './ensure-clientId.rule';
import { ensureRedirectRule } from './ensure-redirect-url.rule';
import { ensureSilentRenewUrlWhenNoRefreshTokenUsed } from './ensure-silentRenewUrl-with-no-refreshtokens.rule';
import { ensureStsServer } from './ensure-sts-server.rule';
import { useOfflineScopeWithSilentRenew } from './use-offline-scope-with-silent-renew.rule';

export const allRules = [
    ensureStsServer,
    useOfflineScopeWithSilentRenew,
    ensureRedirectRule,
    ensureClientId,
    ensureSilentRenewUrlWhenNoRefreshTokenUsed,
];

import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import express, { Application, NextFunction, Request, Response } from 'express';
import { Server } from 'http';
import { exportJWK, importPKCS8, KeyLike, SignJWT } from 'jose';

export interface TestIdpServerOptions {
  port?: number;
  realms?: string[];
  // When true, prompt=none without an SSO session answers login_required.
  // Off by default: the integration tests log in silently without a session.
  promptNoneRequiresSession?: boolean;
}

interface KeyPair {
  privateKey: KeyLike;
  publicKey: string;
  publicJWK: any;
  kid: string;
}

interface Session {
  realm: string;
  state: string;
  nonce?: string;
  clientId?: string;
  scope?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

export class TestIdpServer {
  private app: Application;
  private server: Server | null = null;
  private port: number;
  private realms: string[];
  private promptNoneRequiresSession: boolean;
  private keyPairs: Record<string, KeyPair> = {};
  private activeSessions: Map<string, Session> = new Map();
  private refreshTokenSessions: Map<string, Session> = new Map();
  private loggedOutSessions: Set<string> = new Set();
  private pushedAuthorizationRequests: Map<
    string,
    { realm: string; params: Record<string, string> }
  > = new Map();

  constructor(options: TestIdpServerOptions = {}) {
    this.port = options.port || 8080;
    this.realms = options.realms || ['idp1', 'idp2', 'idp3'];
    this.promptNoneRequiresSession = options.promptNoneRequiresSession ?? false;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(cors({
      origin: true,
      credentials: true
    }));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`Test IDP: ${req.method} ${req.url}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', realms: this.realms });
    });

    this.realms.forEach(realm => {
      this.setupRealmRoutes(realm);
    });
  }

  private setupRealmRoutes(realm: string): void {
    const realmPath = `/${realm}`;

    // OIDC Discovery endpoint
    this.app.get(
      `${realmPath}/.well-known/openid-configuration`,
      (req: Request, res: Response) => {
        res.json({
          issuer: `http://localhost:${this.port}${realmPath}`,
          authorization_endpoint: `http://localhost:${this.port}${realmPath}/authorize`,
          token_endpoint: `http://localhost:${this.port}${realmPath}/token`,
          userinfo_endpoint: `http://localhost:${this.port}${realmPath}/userinfo`,
          end_session_endpoint: `http://localhost:${this.port}${realmPath}/logout`,
          revocation_endpoint: `http://localhost:${this.port}${realmPath}/revoke`,
          pushed_authorization_request_endpoint: `http://localhost:${this.port}${realmPath}/par`,
          jwks_uri: `http://localhost:${this.port}${realmPath}/jwks`,
          scopes_supported: this.getSupportedScopes(realm),
          response_types_supported: ['code', 'id_token token', 'id_token'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          code_challenge_methods_supported: ['S256', 'plain'],
        });
      }
    );

    // Pushed authorization request endpoint (RFC 9126)
    this.app.post(`${realmPath}/par`, (req: Request, res: Response) => {
      const requestUri = `urn:ietf:params:oauth:request_uri:${crypto
        .randomBytes(16)
        .toString('hex')}`;

      console.log(`Test IDP: ${realm} PAR request:`, {
        client_id: req.body.client_id,
        request_uri: requestUri,
      });

      this.pushedAuthorizationRequests.set(requestUri, {
        realm,
        params: req.body,
      });

      res.status(201).json({ request_uri: requestUri, expires_in: 60 });
    });

    // Authorization endpoint
    this.app.get(`${realmPath}/authorize`, async (req: Request, res: Response) => {
      const pushedRequest = this.pushedAuthorizationRequests.get(
        req.query.request_uri as string
      );

      if (req.query.request_uri) {
        this.pushedAuthorizationRequests.delete(req.query.request_uri as string);

        if (!pushedRequest || pushedRequest.realm !== realm) {
          return res.status(400).json({ error: 'invalid_request_uri' });
        }
      }

      const params = { ...req.query, ...pushedRequest?.params };
      const {
        response_type,
        client_id,
        redirect_uri,
        scope,
        state,
        prompt,
        code_challenge,
        code_challenge_method,
        test_response_mode,
      } = params;

      console.log(`Test IDP: ${realm} authorize request:`, {
        response_type,
        client_id,
        redirect_uri,
        prompt,
        par: pushedRequest ? 'yes' : 'no',
        code_challenge: code_challenge ? 'present' : 'missing',
        code_challenge_method,
        cookies: req.cookies
      });

      const hasSsoSession = req.cookies?.SSO_SESSION === 'active';

      // With promptNoneRequiresSession, silent authentication (prompt=none)
      // only succeeds with an SSO session, like a real IdP
      if (
        this.promptNoneRequiresSession &&
        prompt === 'none' &&
        !hasSsoSession
      ) {
        const errorParams = new URLSearchParams({
          error: 'login_required',
          state: state as string,
        });

        return res.redirect(
          response_type === 'code'
            ? `${redirect_uri}?${errorParams}`
            : `${redirect_uri}#${errorParams}`
        );
      }

      // Implicit flow: the tokens are returned in the URL fragment
      if (response_type === 'id_token token' || response_type === 'id_token') {
        const session: Session = {
          realm,
          state: state as string,
          nonce: params.nonce as string,
          clientId: client_id as string,
          scope: scope as string,
        };
        const accessToken = `${realm}-access-token-${Date.now()}`;
        const fragment = new URLSearchParams({
          id_token: await this.getTokenForRealm(realm, session, true, {
            at_hash: this.getAtHash(accessToken),
          }),
          state: state as string,
          token_type: 'Bearer',
          expires_in: '300',
          scope: (scope as string) || this.getScopeString(realm),
        });

        if (response_type === 'id_token token') {
          fragment.set('access_token', accessToken);
        }

        this.setSsoCookie(res);

        return res.redirect(`${redirect_uri}#${fragment}`);
      }

      if (response_type !== 'code') {
        return res.status(400).json({ error: 'unsupported_response_type' });
      }

      // Generate authorization code
      // Unique even when several clients authorize in the same millisecond
      const code = `${realm}-auth-code-${Date.now()}-${crypto
        .randomBytes(8)
        .toString('hex')}`;

      // Store session for this authorization including all parameters
      this.activeSessions.set(code, {
        realm,
        state: state as string,
        nonce: params.nonce as string,
        clientId: client_id as string,
        scope: scope as string,
        codeChallenge: code_challenge as string,
        codeChallengeMethod: code_challenge_method as string
      });

      // For silent authentication (prompt=none) or SSO scenario
      // We simulate that the user has an active session
      if (prompt === 'none' || hasSsoSession) {
        // Redirect back with authorization code
        const redirectUrl = new URL(redirect_uri as string);
        redirectUrl.searchParams.set('code', code);
        redirectUrl.searchParams.set('state', state as string);

        console.log(
          `Test IDP: ${realm} silent auth success, redirecting to:`,
          redirectUrl.toString()
        );

        if (test_response_mode === 'json') {
          return res.json({ redirect_to: redirectUrl.toString() });
        }

        return res.redirect(redirectUrl.toString());
      }

      // For regular authentication, we would show a login page
      // For testing, we'll just redirect with the code
      const redirectUrl = new URL(redirect_uri as string);
      redirectUrl.searchParams.set('code', code);
      redirectUrl.searchParams.set('state', state as string);

      // Set SSO cookie for subsequent requests
      this.setSsoCookie(res);

      if (test_response_mode === 'json') {
        return res.json({ redirect_to: redirectUrl.toString() });
      }

      res.redirect(redirectUrl.toString());
    });

    // Token endpoint
    this.app.post(`${realmPath}/token`, async (req: Request, res: Response) => {
      const {
        grant_type,
        code,
        redirect_uri,
        client_id,
        code_verifier,
        refresh_token,
      } = req.body;

      console.log(`Test IDP: ${realm} token request:`, {
        grant_type,
        code,
        refresh_token,
        code_verifier: code_verifier ? 'present' : 'missing',
      });

      if (grant_type === 'refresh_token') {
        const session = this.refreshTokenSessions.get(refresh_token);

        if (!session || session.realm !== realm) {
          return res.status(400).json({ error: 'invalid_grant' });
        }

        this.refreshTokenSessions.delete(refresh_token);

        const nextRefreshToken = this.createRefreshToken(realm);
        this.refreshTokenSessions.set(nextRefreshToken, session);

        const tokenData = await this.getTokenForRealm(realm, session, false);

        return res.json({
          access_token: `${realm}-access-token-${Date.now()}`,
          id_token: tokenData,
          refresh_token: nextRefreshToken,
          token_type: 'Bearer',
          expires_in: 300,
          scope: session.scope || this.getScopeString(realm),
        });
      }

      if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
      }

      // Verify the authorization code
      const session = this.activeSessions.get(code);
      if (!session || session.realm !== realm) {
        return res.status(400).json({ error: 'invalid_grant' });
      }

      // Verify PKCE if code_challenge was provided
      if (session.codeChallenge) {
        if (!code_verifier) {
          console.log(`Test IDP: ${realm} missing code_verifier for PKCE flow`);
          return res
            .status(400)
            .json({
              error: 'invalid_request',
              error_description: 'code_verifier required',
            });
        }

        // Verify the code_verifier matches the code_challenge
        const verifierBuffer = Buffer.from(code_verifier, 'utf-8');
        const challenge = crypto
          .createHash('sha256')
          .update(verifierBuffer)
          .digest('base64url');

        if (challenge !== session.codeChallenge) {
          console.log(`Test IDP: ${realm} code_verifier validation failed`);
          return res
            .status(400)
            .json({
              error: 'invalid_grant',
              error_description: 'code_verifier validation failed',
            });
        }

        console.log(`Test IDP: ${realm} PKCE validation successful`);
      }

      // Remove used authorization code
      this.activeSessions.delete(code);

      const supportsRefreshTokens = session.scope
        ?.split(' ')
        .includes('offline_access');
      const refreshToken = supportsRefreshTokens
        ? this.createRefreshToken(realm)
        : undefined;

      if (refreshToken) {
        this.refreshTokenSessions.set(refreshToken, session);
      }

      // Get the appropriate test token for this realm with session data
      const tokenData = await this.getTokenForRealm(realm, session);

      res.json({
        access_token: `${realm}-access-token-${Date.now()}`,
        id_token: tokenData,
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
        token_type: 'Bearer',
        expires_in: 300, // 5 minutes to match ID token
        scope: session.scope || this.getScopeString(realm),
      });
      return;
    });

    // Token revocation endpoint (RFC 7009)
    this.app.post(`${realmPath}/revoke`, (req: Request, res: Response) => {
      const { token, token_type_hint } = req.body;

      console.log(`Test IDP: ${realm} revocation request:`, {
        token_type_hint,
        known_refresh_token: this.refreshTokenSessions.has(token),
      });

      this.refreshTokenSessions.delete(token);

      res.status(200).send();
    });

    // JWKS endpoint
    this.app.get(`${realmPath}/jwks`, (req: Request, res: Response) => {
      const keyPair = this.getKeyPairForRealm(realm);
      res.json({
        keys: [keyPair.publicJWK]
      });
    });

    // UserInfo endpoint
    this.app.get(`${realmPath}/userinfo`, (req: Request, res: Response): void => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.includes(`${realm}-access-token`)) {
          res.status(401).json({ error: 'unauthorized' });
          return;
        }

        res.json(this.getUserInfoForRealm(realm));
      }
    );

    // Logout endpoint (OIDC end_session_endpoint)
    this.app.get(`${realmPath}/logout`, async (req: Request, res: Response) => {
      const { id_token_hint, post_logout_redirect_uri, state } = req.query;

      console.log(`Test IDP: ${realm} logout request:`, {
        id_token_hint: id_token_hint ? 'present' : 'missing',
        post_logout_redirect_uri,
        state
      });

      // In a real IDP, you would validate the id_token_hint
      // For testing, we'll just check if it's present
      if (id_token_hint) {
        try {
          // Decode the token to verify it's from this realm
          const tokenParts = (id_token_hint as string).split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log(`Test IDP: ${realm} logout for subject:`, payload.sub);
          }
        } catch (error) {
          console.log(`Test IDP: ${realm} invalid id_token_hint`);
        }
      }

      // In a real OIDC logout, we end the IDP session but the SSO cookie remains
      // This allows other applications to continue using SSO
      // We'll track logged out sessions in memory for testing
      if (!this.loggedOutSessions) {
        this.loggedOutSessions = new Set<string>();
      }
      this.loggedOutSessions.add(`${realm}-${id_token_hint}`);

      // Note: We do NOT clear the SSO_SESSION cookie
      // res.clearCookie('SSO_SESSION');

      // Log the logout for testing purposes
      console.log(`Test IDP: ${realm} logout completed, redirecting to:`, post_logout_redirect_uri);

      if (post_logout_redirect_uri) {
        // Build redirect URL with state if provided
        let redirectUrl = post_logout_redirect_uri as string;
        if (state) {
          const separator = redirectUrl.includes('?') ? '&' : '?';
          redirectUrl = `${redirectUrl}${separator}state=${state}`;
        }
        res.redirect(redirectUrl);
      } else {
        res.send(`Logged out from ${realm}`);
      }
    });
  }

  private getSupportedScopes(realm: string): string[] {
    switch (realm) {
      case 'master-idp':
        return ['openid', 'profile', 'email', 'offline_access'];
      case 'secondary-idp-1':
        return ['openid', 'profile', 'offline_access'];
      case 'secondary-idp-2':
        return ['openid', 'email', 'offline_access'];
      case 'idp1':
        return ['openid', 'profile', 'email', 'offline_access'];
      case 'idp2':
        return ['openid', 'profile', 'offline_access'];
      case 'idp3':
        return ['openid', 'email', 'offline_access'];
      default:
        return ['openid', 'offline_access'];
    }
  }

  private getScopeString(realm: string): string {
    return this.getSupportedScopes(realm).join(' ');
  }

  private setSsoCookie(res: Response): void {
    res.cookie('SSO_SESSION', 'active', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });
  }

  // at_hash: base64url of the left half of the SHA-256 hash of the access token
  private getAtHash(accessToken: string): string {
    const hash = crypto.createHash('sha256').update(accessToken).digest();

    return hash.subarray(0, hash.length / 2).toString('base64url');
  }

  private async getTokenForRealm(
    realm: string,
    session?: Session,
    includeNonce = true,
    extraClaims: Record<string, unknown> = {}
  ): Promise<string> {
    const keyPair = this.getKeyPairForRealm(realm);
    const claims = {
      ...this.getClaimsForRealm(realm, session, includeNonce),
      ...extraClaims,
    };

    // Add a unique timestamp with millisecond precision to ensure different IATs
    // Add light jitter (0-10ms) based on realm to ensure different IATs
    const jitter = this.getJitterForRealm(realm);
    const now = Date.now() + jitter;
    const iatWithMillis = Math.floor(now / 1000) + (now % 1000) / 1000000;

    const jwt = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: keyPair.kid })
      .setIssuer(`http://localhost:${this.port}/${realm}`)
      .setAudience(session?.clientId || this.getClientIdForRealm(realm))
      .setExpirationTime('5m')
      .setIssuedAt(iatWithMillis)
      .sign(keyPair.privateKey);

    return jwt;
  }

  private createRefreshToken(realm: string): string {
    return `${realm}-refresh-token-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }

  private getKeyPairForRealm(realm: string): KeyPair {
    const realmKey = this.mapRealmToKey(realm);
    const keyPair = this.keyPairs[realmKey];
    if (!keyPair) {
      throw new Error(`No key pair found for realm: ${realm}`);
    }
    return keyPair;
  }

  private mapRealmToKey(realm: string): string {
    switch (realm) {
      case 'master-idp':
        return 'master';
      case 'secondary-idp-1':
        return 'secondary1';
      case 'secondary-idp-2':
        return 'secondary2';
      case 'idp1':
        return 'idp1';
      case 'idp2':
        return 'idp2';
      case 'idp3':
        return 'idp3';
      default:
        return realm;
    }
  }

  private getJitterForRealm(realm: string): number {
    // Add deterministic jitter based on realm to ensure different IATs
    switch (realm) {
      case 'idp1':
        return 0; // No jitter
      case 'idp2':
        return 5; // 5ms jitter
      case 'idp3':
        return 10; // 10ms jitter
      default:
        return Math.floor(Math.random() * 10); // Random 0-10ms for other realms
    }
  }

  private getClientIdForRealm(realm: string): string {
    switch (realm) {
      case 'idp1':
        return 'client-idp1';
      case 'idp2':
        return 'client-idp2';
      case 'idp3':
        return 'client-idp3';
      default:
        return 'unknown-client';
    }
  }

  private getClaimsForRealm(
    realm: string,
    session?: Session,
    includeNonce = true
  ): any {
    const userInfo = this.getUserInfoForRealm(realm);
    const scope = session?.scope || this.getScopeString(realm);

    // Parse the scope to bp: prefixed roles
    const scopes = scope.split(' ');
    const bpRoles = scopes
      .filter((s) => s.startsWith('bp:'))
      .map((s) => s.substring(3));

    return {
      ...userInfo,
      ...(includeNonce ? { nonce: session?.nonce || 'test-nonce' } : {}),
      azp: session?.clientId || this.getClientIdForRealm(realm),
      scope: scope,
    };
  }

  private getUserInfoForRealm(realm: string): any {
    switch (realm) {
      case 'master-idp':
        return {
          sub: 'master-user-123',
          name: 'Test User',
          email: 'test@example.com',
          preferred_username: 'testuser'
        };
      case 'secondary-idp-1':
        return {
          sub: 'secondary1-user-123',
          name: 'Test User',
          preferred_username: 'testuser'
        };
      case 'secondary-idp-2':
        return {
          sub: 'secondary2-user-123',
          email: 'test@example.com',
          preferred_username: 'testuser'
        };
      case 'idp1':
        return {
          sub: 'idp1-user-123',
          name: 'Test User IDP1',
          email: 'test@example.com',
          preferred_username: 'testuser1'
        };
      case 'idp2':
        return {
          sub: 'idp2-user-123',
          name: 'Test User IDP2',
          preferred_username: 'testuser2'
        };
      case 'idp3':
        return {
          sub: 'idp3-user-123',
          email: 'test@example.com',
          preferred_username: 'testuser3'
        };
      default:
        return { sub: 'unknown-user' };
    }
  }

  private async generateTestData(): Promise<void> {
    // Generate key pairs for each realm
    const keyRealms = [
      'master',
      'secondary1',
      'secondary2',
      'idp1',
      'idp2',
      'idp3',
    ];
    for (const realm of keyRealms) {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const kid = `${realm}-key-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const privateKeyJose = await importPKCS8(privateKey, 'RS256');
      const publicKeyBuffer = crypto.createPublicKey(publicKey);
      const publicJWK = await exportJWK(publicKeyBuffer);
      publicJWK.kid = kid;
      publicJWK.use = 'sig';
      publicJWK.alg = 'RS256';

      this.keyPairs[realm] = {
        privateKey: privateKeyJose,
        publicKey,
        publicJWK,
        kid
      };
    }
  }

  async start(): Promise<void> {
    // Generate test data
    await this.generateTestData();

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Test IDP server started on http://localhost:${this.port}`);
        console.log(`Realms available: ${this.realms.join(', ')}`);
        resolve();
      }).on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Test IDP server stopped');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getUrl(realm?: string): string {
    const baseUrl = `http://localhost:${this.port}`;
    return realm ? `${baseUrl}/${realm}` : baseUrl;
  }
}

import express, { Application, Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { SignJWT, exportJWK, importPKCS8, KeyLike } from 'jose';
import crypto from 'crypto';

export interface TestIdpServerOptions {
  port?: number;
  realms?: string[];
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
  private keyPairs: Record<string, KeyPair> = {};
  private activeSessions: Map<string, Session> = new Map();
  private loggedOutSessions: Set<string> = new Set();

  constructor(options: TestIdpServerOptions = {}) {
    this.port = options.port || 8080;
    this.realms = options.realms || ['idp1', 'idp2', 'idp3'];
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
    this.app.get(`${realmPath}/.well-known/openid-configuration`, (req: Request, res: Response) => {
      res.json({
        issuer: `http://localhost:${this.port}${realmPath}`,
        authorization_endpoint: `http://localhost:${this.port}${realmPath}/authorize`,
        token_endpoint: `http://localhost:${this.port}${realmPath}/token`,
        userinfo_endpoint: `http://localhost:${this.port}${realmPath}/userinfo`,
        end_session_endpoint: `http://localhost:${this.port}${realmPath}/logout`,
        jwks_uri: `http://localhost:${this.port}${realmPath}/jwks`,
        scopes_supported: this.getSupportedScopes(realm),
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        code_challenge_methods_supported: ['S256', 'plain']
      });
    });

    // Authorization endpoint
    this.app.get(`${realmPath}/authorize`, (req: Request, res: Response) => {
      const { response_type, client_id, redirect_uri, scope, state, prompt, code_challenge, code_challenge_method } = req.query;

      console.log(`Test IDP: ${realm} authorize request:`, {
        response_type,
        client_id,
        redirect_uri,
        prompt,
        code_challenge: code_challenge ? 'present' : 'missing',
        code_challenge_method,
        cookies: req.cookies
      });

      if (response_type !== 'code') {
        return res.status(400).json({ error: 'unsupported_response_type' });
      }

      // Generate authorization code
      const code = `${realm}-auth-code-${Date.now()}`;

      // Store session for this authorization including all parameters
      this.activeSessions.set(code, {
        realm,
        state: state as string,
        nonce: req.query.nonce as string,
        clientId: client_id as string,
        scope: scope as string,
        codeChallenge: code_challenge as string,
        codeChallengeMethod: code_challenge_method as string
      });

      // For silent authentication (prompt=none) or SSO scenario
      // We simulate that the user has an active session
      if (prompt === 'none' || req.cookies?.SSO_SESSION === 'active') {
        // Redirect back with authorization code
        const redirectUrl = new URL(redirect_uri as string);
        redirectUrl.searchParams.set('code', code);
        redirectUrl.searchParams.set('state', state as string);

        console.log(`Test IDP: ${realm} silent auth success, redirecting to:`, redirectUrl.toString());
        return res.redirect(redirectUrl.toString());
      }

      // For regular authentication, we would show a login page
      // For testing, we'll just redirect with the code
      const redirectUrl = new URL(redirect_uri as string);
      redirectUrl.searchParams.set('code', code);
      redirectUrl.searchParams.set('state', state as string);

      // Set SSO cookie for subsequent requests
      res.cookie('SSO_SESSION', 'active', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 3600000 // 1 hour
      });
      res.redirect(redirectUrl.toString());
    });

    // Token endpoint
    this.app.post(`${realmPath}/token`, async (req: Request, res: Response) => {
      const { grant_type, code, redirect_uri, client_id, code_verifier } = req.body;

      console.log(`Test IDP: ${realm} token request:`, {
        grant_type,
        code,
        code_verifier: code_verifier ? 'present' : 'missing'
      });

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
          return res.status(400).json({ error: 'invalid_request', error_description: 'code_verifier required' });
        }

        // Verify the code_verifier matches the code_challenge
        const verifierBuffer = Buffer.from(code_verifier, 'utf-8');
        const challenge = crypto.createHash('sha256').update(verifierBuffer).digest('base64url');

        if (challenge !== session.codeChallenge) {
          console.log(`Test IDP: ${realm} code_verifier validation failed`);
          return res.status(400).json({ error: 'invalid_grant', error_description: 'code_verifier validation failed' });
        }

        console.log(`Test IDP: ${realm} PKCE validation successful`);
      }

      // Remove used authorization code
      this.activeSessions.delete(code);

      // Get the appropriate test token for this realm with session data
      const tokenData = await this.getTokenForRealm(realm, session);

      res.json({
        access_token: `${realm}-access-token-${Date.now()}`,
        id_token: tokenData,
        token_type: 'Bearer',
        expires_in: 300, // 5 minutes to match ID token
        scope: session.scope || this.getScopeString(realm)
      });
      return;
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
    });

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
        return ['openid', 'profile', 'email'];
      case 'secondary-idp-1':
        return ['openid', 'profile'];
      case 'secondary-idp-2':
        return ['openid', 'email'];
      case 'idp1':
        return ['openid', 'profile', 'email'];
      case 'idp2':
        return ['openid', 'profile'];
      case 'idp3':
        return ['openid', 'email'];
      default:
        return ['openid'];
    }
  }

  private getScopeString(realm: string): string {
    return this.getSupportedScopes(realm).join(' ');
  }

  private async getTokenForRealm(realm: string, session?: Session): Promise<string> {
    const keyPair = this.getKeyPairForRealm(realm);
    const claims = this.getClaimsForRealm(realm, session);

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

  private getClaimsForRealm(realm: string, session?: Session): any {
    const userInfo = this.getUserInfoForRealm(realm);
    const scope = session?.scope || this.getScopeString(realm);

    // Parse the scope to bp: prefixed roles
    const scopes = scope.split(' ');
    const bpRoles = scopes
      .filter(s => s.startsWith('bp:'))
      .map(s => s.substring(3));

    return {
      ...userInfo,
      nonce: session?.nonce || 'test-nonce',
      azp: session?.clientId || this.getClientIdForRealm(realm),
      scope: scope
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
    const keyRealms = ['master', 'secondary1', 'secondary2', 'idp1', 'idp2', 'idp3'];
    for (const realm of keyRealms) {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      const kid = `${realm}-key-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

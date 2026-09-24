import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const collectionPath = path.resolve(
  import.meta.dirname,
  '../../../dist/angular-auth-oidc-client/schematics/collection.json'
);

const appPath = 'projects/app/src/app';
const appModulePath = `${appPath}/app-module.ts`;
const appSpecPath = `${appPath}/app.spec.ts`;
const appConfigPath = `${appPath}/app.config.ts`;

// The generated spec already imports `RouterModule.forRoot([])`, the AppModule
// is added as the last entry keeping the multi-line formatting.
const importsWithAppModule = `imports: [\n        RouterModule.forRoot([]),\n        AppModule\n      ],`;

const defaultOptions = {
  authorityUrlOrTenantId: 'https://my-authority',
  flowType: 'OIDC Code Flow PKCE using refresh tokens',
  useLocalPackage: false,
};

describe('ng-add', () => {
  let runner: SchematicTestRunner;

  beforeEach(() => {
    runner = new SchematicTestRunner('angular-auth-oidc-client', collectionPath);
  });

  async function createApp(standalone: boolean): Promise<UnitTestTree> {
    const workspace = await runner.runExternalSchematic('@schematics/angular', 'workspace', {
      name: 'workspace',
      newProjectRoot: 'projects',
      version: '22.0.0',
    });

    return runner.runExternalSchematic(
      '@schematics/angular',
      'application',
      { name: 'app', standalone, routing: true, ssr: false },
      workspace
    );
  }

  function runNgAdd(tree: UnitTestTree, options: Record<string, unknown> = {}): Promise<UnitTestTree> {
    return runner.runSchematic('ng-add', { ...defaultOptions, ...options }, tree);
  }

  describe('standalone application', () => {
    it('uses the standalone setup by default', async () => {
      const tree = await runNgAdd(await createApp(true));

      expect(tree.exists(`${appPath}/auth/auth.config.ts`)).toBe(true);
      expect(tree.exists(`${appPath}/auth/auth-config.module.ts`)).toBe(false);
      expect(tree.readText(appConfigPath)).toContain('provideAuth(authConfig)');
    });

    it('uses the standalone setup with --standalone', async () => {
      const tree = await runNgAdd(await createApp(true), { standalone: true });

      expect(tree.exists(`${appPath}/auth/auth.config.ts`)).toBe(true);
      expect(tree.readText(appConfigPath)).toContain('provideAuth(authConfig)');
    });

    it('creates the http config file for the http config flow', async () => {
      const tree = await runNgAdd(await createApp(true), {
        standalone: true,
        flowType: 'OIDC Code Flow PKCE using iframe silent renew getting config from http',
      });

      expect(tree.exists(`${appPath}/auth/auth-http.config.ts`)).toBe(true);
      expect(tree.readText(appConfigPath)).toContain('provideAuth(authConfig)');
    });

    it('does not change the app spec', async () => {
      const app = await createApp(true);
      const specBefore = app.readText(appSpecPath);

      const tree = await runNgAdd(app);

      expect(tree.readText(appSpecPath)).toBe(specBefore);
    });

    it('fails with --legacy-modules because there is no AppModule', async () => {
      const app = await createApp(true);

      await expect(runNgAdd(app, { legacyModules: true })).rejects.toThrow(
        `The option '--legacy-modules' requires an NgModule based application`
      );
    });
  });

  describe('NgModule application', () => {
    it('uses the legacy modules setup by default', async () => {
      const tree = await runNgAdd(await createApp(false));

      expect(tree.exists(`${appPath}/auth/auth-config.module.ts`)).toBe(true);
      expect(tree.exists(`${appPath}/auth/auth.config.ts`)).toBe(false);
      expect(tree.readText(appModulePath)).toContain(`import { AuthConfigModule } from './auth/auth-config.module';`);
      expect(tree.readText(appModulePath)).toMatch(/imports: \[[^\]]*AuthConfigModule/);
    });

    it('uses the legacy modules setup with --legacy-modules', async () => {
      const tree = await runNgAdd(await createApp(false), { legacyModules: true });

      expect(tree.exists(`${appPath}/auth/auth-config.module.ts`)).toBe(true);
      expect(tree.readText(appModulePath)).toMatch(/imports: \[[^\]]*AuthConfigModule/);
    });

    it('creates the http config module for the http config flow', async () => {
      const tree = await runNgAdd(await createApp(false), {
        legacyModules: true,
        flowType: 'OIDC Code Flow PKCE using iframe silent renew getting config from http',
      });

      expect(tree.exists(`${appPath}/auth/auth-http-config.module.ts`)).toBe(true);
      expect(tree.readText(appModulePath)).toMatch(/imports: \[[^\]]*AuthHttpConfigModule/);
    });

    it('uses the standalone setup with --standalone and provides the config in the AppModule', async () => {
      const tree = await runNgAdd(await createApp(false), { standalone: true });

      expect(tree.exists(`${appPath}/auth/auth.config.ts`)).toBe(true);
      expect(tree.exists(`${appPath}/auth/auth-config.module.ts`)).toBe(false);
      expect(tree.readText(appModulePath)).toMatch(/providers: \[[^\]]*provideAuth\(authConfig\)/);
      expect(tree.readText(appModulePath)).not.toContain('AuthConfigModule');
    });

    it.each([
      ['default', {}],
      ['--legacy-modules', { legacyModules: true }],
      ['--standalone', { standalone: true }],
    ])('imports the AppModule in the app spec (%s)', async (_, options) => {
      const tree = await runNgAdd(await createApp(false), options);
      const spec = tree.readText(appSpecPath);

      expect(spec).toContain(`import { AppModule } from './app-module';`);
      expect(spec).toContain(importsWithAppModule);
      expect(spec).not.toContain('declarations');
    });
  });

  describe('app spec update', () => {
    it('keeps declarations which are not part of the AppModule', async () => {
      const app = await createApp(false);
      app.overwrite(
        appSpecPath,
        app
          .readText(appSpecPath)
          .replace(/declarations: \[[^\]]*\]/, 'declarations: [App, OtherComponent]')
      );

      const tree = await runNgAdd(app);
      const spec = tree.readText(appSpecPath);

      expect(spec).toContain('declarations: [OtherComponent]');
      expect(spec).toContain(importsWithAppModule);
    });

    it('does not import the AppModule twice', async () => {
      const app = await createApp(false);
      const tree = await runNgAdd(app);
      const specAfterFirstRun = tree.readText(appSpecPath);

      const secondRun = await runNgAdd(tree, { standalone: true });

      expect(secondRun.readText(appSpecPath)).toBe(specAfterFirstRun);
    });

    it('leaves a spec without a TestBed configuration unchanged', async () => {
      const app = await createApp(false);
      const customSpec = `describe('App', () => {\n  it('works', () => {\n    expect(true).toBe(true);\n  });\n});\n`;
      app.overwrite(appSpecPath, customSpec);

      const tree = await runNgAdd(app);

      expect(tree.readText(appSpecPath)).toBe(customSpec);
    });
  });

  it('fails when --standalone and --legacy-modules are combined', async () => {
    const app = await createApp(false);

    await expect(runNgAdd(app, { standalone: true, legacyModules: true })).rejects.toThrow(
      `The options '--standalone' and '--legacy-modules' cannot be used together.`
    );
  });
});

import { describe, expect, it } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { OpenIdConfiguration } from '../openid-configuration';
import { StsConfigHttpLoader, StsConfigStaticLoader } from './config-loader';

describe('ConfigLoader', () => {
  describe('StsConfigStaticLoader', () => {
    describe('loadConfigs', () => {
      it('returns an array if an array is passed', async () => {
        const toPass = [
          { configId: 'configId1' } as OpenIdConfiguration,
          { configId: 'configId2' } as OpenIdConfiguration,
        ];
        const loader = new StsConfigStaticLoader(toPass);
        const result = await firstValueFrom(loader.loadConfigs());

        expect(Array.isArray(result)).toBe(true);
      });

      it('returns an array if only one config is passed', async () => {
        const loader = new StsConfigStaticLoader({
          configId: 'configId1',
        } as OpenIdConfiguration);
        const result = await firstValueFrom(loader.loadConfigs());

        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('StsConfigHttpLoader', () => {
    describe('loadConfigs', () => {
      it('returns an array if an array of observables is passed', async () => {
        const toPass = [
          of({ configId: 'configId1' } as OpenIdConfiguration),
          of({ configId: 'configId2' } as OpenIdConfiguration),
        ];
        const loader = new StsConfigHttpLoader(toPass);
        const result = await firstValueFrom(loader.loadConfigs());

        expect(Array.isArray(result)).toBe(true);
        expect(result[0].configId).toBe('configId1');
        expect(result[1].configId).toBe('configId2');
      });

      it('returns an array if an observable with a config array is passed', async () => {
        const toPass = of([
          { configId: 'configId1' } as OpenIdConfiguration,
          { configId: 'configId2' } as OpenIdConfiguration,
        ]);
        const loader = new StsConfigHttpLoader(toPass);
        const result = await firstValueFrom(loader.loadConfigs());

        expect(Array.isArray(result)).toBe(true);
        expect(result[0].configId).toBe('configId1');
        expect(result[1].configId).toBe('configId2');
      });

      it('returns an array if only one config is passed', async () => {
        const loader = new StsConfigHttpLoader(
          of({ configId: 'configId1' } as OpenIdConfiguration)
        );
        const result = await firstValueFrom(loader.loadConfigs());

        expect(Array.isArray(result)).toBe(true);
        expect(result[0].configId).toBe('configId1');
      });
    });
  });
});

import { OpenIdConfiguration } from '../openid-configuration';
import { StsConfigHttpLoader, StsConfigStaticLoader } from './config-loader';
describe('ConfigLoader', () => {
  describe('StsConfigStaticLoader', () => {
    describe('loadConfigs', () => {
      it('returns an array if an array is passed', () => {
        const toPass = [{} as OpenIdConfiguration, {} as OpenIdConfiguration];

        const loader = new StsConfigStaticLoader(toPass);

        const result = loader.loadConfigs();

        expect(Array.isArray(result)).toBeTrue();
      });

      it('returns an array if only one config is passed', () => {
        const loader = new StsConfigStaticLoader({} as OpenIdConfiguration);

        const result = loader.loadConfigs();

        expect(Array.isArray(result)).toBeTrue();
      });

      it('all entries in array are Promises', () => {
        const loader = new StsConfigStaticLoader({} as OpenIdConfiguration);

        const result = loader.loadConfigs();

        const allEntriesArePromises = result.every((x) => x instanceof Promise);

        expect(allEntriesArePromises).toBeTrue();
      });
    });
  });

  describe('StsConfigHttpLoader', () => {
    describe('loadConfigs', () => {
      it('returns an array if an array is passed', () => {
        const promise1 = new Promise<OpenIdConfiguration>((resolve, reject) => {
          resolve({} as OpenIdConfiguration);
        });

        const promise2 = new Promise<OpenIdConfiguration>((resolve, reject) => {
          resolve({} as OpenIdConfiguration);
        });

        const toPass = [promise1, promise2];

        const loader = new StsConfigHttpLoader(toPass);

        const result = loader.loadConfigs();

        expect(Array.isArray(result)).toBeTrue();
      });

      it('returns an array if only one config is passed', () => {
        const promise1 = new Promise<OpenIdConfiguration>((resolve, reject) => {
          resolve({} as OpenIdConfiguration);
        });

        const loader = new StsConfigHttpLoader(promise1);

        const result = loader.loadConfigs();

        expect(Array.isArray(result)).toBeTrue();
      });

      it('all entries in array are Promises', () => {
        const promise1 = new Promise<OpenIdConfiguration>((resolve, reject) => {
          resolve({} as OpenIdConfiguration);
        });

        const loader = new StsConfigHttpLoader(promise1);

        const result = loader.loadConfigs();
        const allEntriesArePromises = result.every((x) => x instanceof Promise);

        expect(allEntriesArePromises).toBeTrue();
      });
    });
  });
});

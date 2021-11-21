import { Observable, of } from 'rxjs';
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

      it('all entries in array are Observables', () => {
        const loader = new StsConfigStaticLoader({} as OpenIdConfiguration);

        const result = loader.loadConfigs();

        const allEntriesAreObservables = result.every((x) => x instanceof Observable);

        expect(allEntriesAreObservables).toBeTrue();
      });
    });
  });

  describe('StsConfigHttpLoader', () => {
    describe('loadConfigs', () => {
      it('returns an array if an array is passed', () => {
        const toPass = [of({} as OpenIdConfiguration), of({} as OpenIdConfiguration)];

        const loader = new StsConfigHttpLoader(toPass);

        const result = loader.loadConfigs();

        expect(Array.isArray(result)).toBeTrue();
      });

      it('returns an array if only one config is passed', () => {
        const loader = new StsConfigHttpLoader(of({} as OpenIdConfiguration));

        const result = loader.loadConfigs();

        expect(Array.isArray(result)).toBeTrue();
      });

      it('all entries in array are Observables', () => {
        const loader = new StsConfigHttpLoader(of({} as OpenIdConfiguration));

        const result = loader.loadConfigs();
        const allEntriesAreObservables = result.every((x) => x instanceof Observable);

        expect(allEntriesAreObservables).toBeTrue();
      });
    });
  });
});

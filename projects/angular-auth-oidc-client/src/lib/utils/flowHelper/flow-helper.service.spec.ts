import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { FlowHelper } from './flow-helper.service';

describe('FlowHelper', () => {
  let flowHelperSpec: SpectatorService<FlowHelper>;
  let flowHelper: FlowHelper;
  let configProvider: SpyObject<ConfigurationProvider>;

  const createService = createServiceFactory({
    service: FlowHelper,
    mocks: [ConfigurationProvider],
  });

  beforeEach(() => {
    flowHelperSpec = createService();
    flowHelper = flowHelperSpec.service;
    configProvider = flowHelperSpec.inject<ConfigurationProvider>(ConfigurationProvider);
  });

  it('should create', () => {
    expect(flowHelper).toBeTruthy();
  });

  describe('isCurrentFlowCodeFlow', () => {
    it('isCurrentFlowCodeFlow returns false if current flow is not code flow', () => {
      const config = { responseType: 'id_token token', configId: 'configId' };

      configProvider.getOpenIDConfiguration.and.returnValue(config);

      expect(flowHelper.isCurrentFlowCodeFlow(config.configId)).toBeFalse();
    });

    it('isCurrentFlowCodeFlow returns true if current flow is code flow', () => {
      const config = { responseType: 'code', configId: 'configId' };

      configProvider.getOpenIDConfiguration.and.returnValue(config);

      expect(flowHelper.isCurrentFlowCodeFlow(config.configId)).toBeTrue();
    });
  });

  describe('currentFlowIs', () => {
    it('currentFlowIs returns true if current flow is code flow', () => {
      const config = { responseType: 'code', configId: 'configId' };

      configProvider.getOpenIDConfiguration.and.returnValue(config);

      expect(flowHelper.currentFlowIs('code', config.configId)).toBeTrue();
    });

    it('currentFlowIs returns true if current flow is code flow (array)', () => {
      const config = { responseType: 'code', configId: 'configId' };

      configProvider.getOpenIDConfiguration.and.returnValue(config);

      expect(flowHelper.currentFlowIs(['code'], config.configId)).toBeTrue();
    });

    it('currentFlowIs returns true if current flow is id_token token or code (array)', () => {
      const config = { responseType: 'id_token token', configId: 'configId' };

      configProvider.getOpenIDConfiguration.and.returnValue(config);

      expect(flowHelper.currentFlowIs(['id_token token', 'code'], config.configId)).toBeTrue();
    });

    it('currentFlowIs returns true if current flow is code flow', () => {
      const config = { responseType: 'id_token token', configId: 'configId' };

      configProvider.getOpenIDConfiguration.and.returnValue(config);

      expect(flowHelper.currentFlowIs('code', config.configId)).toBeFalse();
    });
  });

  describe('isCurrentFlowImplicitFlowWithAccessToken', () => {
    it('isCurrentFlowImplicitFlowWithAccessToken return true if flow is "id_token token"', () => {
      const config = { responseType: 'id_token token', configId: 'configId' };
      configProvider.getOpenIDConfiguration.and.returnValue(config);

      const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken(config.configId);

      expect(result).toBeTrue();
    });

    it('isCurrentFlowImplicitFlowWithAccessToken return false if flow is not "id_token token"', () => {
      const config = { responseType: 'id_token2 token2', configId: 'configId' };
      configProvider.getOpenIDConfiguration.and.returnValue(config);

      const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken(config.configId);

      expect(result).toBeFalse();
    });
  });

  describe('isCurrentFlowImplicitFlowWithoutAccessToken', () => {
    it('isCurrentFlowImplicitFlowWithoutAccessToken return true if flow is "id_token"', () => {
      const config = { responseType: 'id_token', configId: 'configId' };
      configProvider.getOpenIDConfiguration.and.returnValue(config);

      const result = (flowHelper as any).isCurrentFlowImplicitFlowWithoutAccessToken(config.configId);

      expect(result).toBeTrue();
    });

    it('isCurrentFlowImplicitFlowWithoutAccessToken return false if flow is not "id_token token"', () => {
      const config = { responseType: 'id_token2', configId: 'configId' };
      configProvider.getOpenIDConfiguration.and.returnValue(config);

      const result = (flowHelper as any).isCurrentFlowImplicitFlowWithoutAccessToken(config.configId);

      expect(result).toBeFalse();
    });
  });

  describe('isCurrentFlowCodeFlowWithRefreshTokens', () => {
    it('isCurrentFlowCodeFlowWithRefreshTokens return false if flow is not code flow', () => {
      const config = { responseType: 'not code', configId: 'configId' };
      configProvider.getOpenIDConfiguration.and.returnValue(config);
      const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config.configId);
      expect(result).toBeFalse();
    });
    it('isCurrentFlowCodeFlowWithRefreshTokens return false if useRefreshToken is set to false', () => {
      const config = { responseType: 'not code', useRefreshToken: false, configId: 'configId' };
      configProvider.getOpenIDConfiguration.and.returnValue(config);
      const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config.configId);
      expect(result).toBeFalse();
    });
    it('isCurrentFlowCodeFlowWithRefreshTokens return true if useRefreshToken is set to true and code flow', () => {
      const config = { responseType: 'code', useRefreshToken: true, configId: 'configId' };
      configProvider.getOpenIDConfiguration.and.returnValue(config);
      const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config.configId);
      expect(result).toBeTrue();
    });
  });

  describe('isCurrentFlowAnyImplicitFlow', () => {
    it('returns true if currentFlowIsImplicitFlowWithAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(true);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow('anyConfigId');

      expect(result).toBeTrue();
    });

    it('returns true if isCurrentFlowImplicitFlowWithoutAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(true);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow('anyConfigId');

      expect(result).toBeTrue();
    });

    it('returns false it is not any implicit flow', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow('anyConfigId');

      expect(result).toBeFalse();
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { ConfigurationProviderMock } from '../../config/provider/config.provider-mock';
import { FlowHelper } from './flow-helper.service';

describe('Flow Helper Service', () => {
  let configProvider: ConfigurationProvider;
  let flowHelper: FlowHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FlowHelper, { provide: ConfigurationProvider, useClass: ConfigurationProviderMock }],
    });
  });

  beforeEach(() => {
    configProvider = TestBed.inject(ConfigurationProvider);
    flowHelper = TestBed.inject(FlowHelper);
  });

  it('should create', () => {
    expect(flowHelper).toBeTruthy();
  });

  it('isCurrentFlowCodeFlow returns false if current flow is not code flow', () => {
    const config = { responseType: 'id_token token', configId: 'configId' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);

    expect(flowHelper.isCurrentFlowCodeFlow('configId')).toBeFalse();
  });

  it('isCurrentFlowCodeFlow returns true if current flow is code flow', () => {
    const config = { responseType: 'code' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);

    expect(flowHelper.isCurrentFlowCodeFlow('configId')).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow', () => {
    const config = { responseType: 'code' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);

    expect(flowHelper.currentFlowIs('code', 'configId')).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow (array)', () => {
    const config = { responseType: 'code' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);

    expect(flowHelper.currentFlowIs(['code'], 'configId')).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is id_token token or code (array)', () => {
    const config = { responseType: 'id_token token' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);

    expect(flowHelper.currentFlowIs(['id_token token', 'code'], 'configId')).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow', () => {
    const config = { responseType: 'id_token token' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);

    expect(flowHelper.currentFlowIs('code', 'configId')).toBeFalse();
  });

  it('isCurrentFlowImplicitFlowWithAccessToken return true if flow is "id_token token"', () => {
    const config = { responseType: 'id_token token' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);
    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken('configId');

    expect(result).toBeTrue();
  });

  it('isCurrentFlowImplicitFlowWithAccessToken return false if flow is not "id_token token"', () => {
    const config = { responseType: 'id_token2 token2' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);
    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken('configId');

    expect(result).toBeFalse();
  });

  it('isCurrentFlowImplicitFlowWithoutAccessToken return true if flow is "id_token"', () => {
    const config = { responseType: 'id_token' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);
    const result = (flowHelper as any).isCurrentFlowImplicitFlowWithoutAccessToken('configId');

    expect(result).toBeTrue();
  });

  it('isCurrentFlowImplicitFlowWithoutAccessToken return false if flow is not "id_token token"', () => {
    const config = { responseType: 'id_token2' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);
    const result = (flowHelper as any).isCurrentFlowImplicitFlowWithoutAccessToken('configId');

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return false if flow is not code flow', () => {
    const config = { responseType: 'not code' };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens('configId');

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return false if useRefreshToken is set to false', () => {
    const config = { responseType: 'not code', useRefreshToken: false };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens('configId');

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return true if useRefreshToken is set to true and code flow', () => {
    const config = { responseType: 'code', useRefreshToken: true };

    spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue(config);
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens('configId');

    expect(result).toBeTrue();
  });

  describe('isCurrentFlowAnyImplicitFlow', () => {
    it('returns true if currentFlowIsImplicitFlowWithAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(true);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow('configId');

      expect(result).toBeTrue();
    });

    it('returns true if isCurrentFlowImplicitFlowWithoutAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(true);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow('configId');

      expect(result).toBeTrue();
    });

    it('returns false it is not any implicit flow', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow('configId');

      expect(result).toBeFalse();
    });
  });
});

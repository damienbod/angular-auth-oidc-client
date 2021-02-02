import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../../config/config.provider';
import { PlatformProvider } from '../platform-provider/platform.provider';
import { PlatformProviderMock } from '../platform-provider/platform.provider-mock';
import { FlowHelper } from './flow-helper.service';

describe('Flow Helper Service', () => {
  let configProvider: ConfigurationProvider;
  let flowHelper: FlowHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigurationProvider, FlowHelper, { provide: PlatformProvider, useClass: PlatformProviderMock }],
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
    const config = { responseType: 'id_token token' };

    configProvider.setConfig(config);

    expect(flowHelper.isCurrentFlowCodeFlow()).toBeFalse();
  });

  it('isCurrentFlowCodeFlow returns true if current flow is code flow', () => {
    const config = { responseType: 'code' };

    configProvider.setConfig(config);

    expect(flowHelper.isCurrentFlowCodeFlow()).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow', () => {
    const config = { responseType: 'code' };

    configProvider.setConfig(config);

    expect(flowHelper.currentFlowIs('code')).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow (array)', () => {
    const config = { responseType: 'code' };

    configProvider.setConfig(config);

    expect(flowHelper.currentFlowIs(['code'])).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is id_token token or code (array)', () => {
    const config = { responseType: 'id_token token' };

    configProvider.setConfig(config);

    expect(flowHelper.currentFlowIs(['id_token token', 'code'])).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow', () => {
    const config = { responseType: 'id_token token' };

    configProvider.setConfig(config);

    expect(flowHelper.currentFlowIs('code')).toBeFalse();
  });

  it('isCurrentFlowImplicitFlowWithAccessToken return true if flow is "id_token token"', () => {
    const config = { responseType: 'id_token token' };

    configProvider.setConfig(config);
    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken();

    expect(result).toBeTrue();
  });

  it('isCurrentFlowImplicitFlowWithAccessToken return false if flow is not "id_token token"', () => {
    const config = { responseType: 'id_token2 token2' };

    configProvider.setConfig(config);
    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken();

    expect(result).toBeFalse();
  });

  it('isCurrentFlowImplicitFlowWithoutAccessToken return true if flow is "id_token"', () => {
    const config = { responseType: 'id_token' };

    configProvider.setConfig(config);
    const result = flowHelper.isCurrentFlowImplicitFlowWithoutAccessToken();

    expect(result).toBeTrue();
  });

  it('isCurrentFlowImplicitFlowWithoutAccessToken return false if flow is not "id_token token"', () => {
    const config = { responseType: 'id_token2' };

    configProvider.setConfig(config);
    const result = flowHelper.isCurrentFlowImplicitFlowWithoutAccessToken();

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return false if flow is not code flow', () => {
    const config = { responseType: 'not code' };

    configProvider.setConfig(config);
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens();

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return false if useRefreshToken is set to false', () => {
    const config = { responseType: 'not code', useRefreshToken: false };

    configProvider.setConfig(config);
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens();

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return true if useRefreshToken is set to true and code flow', () => {
    const config = { responseType: 'code', useRefreshToken: true };

    configProvider.setConfig(config);
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens();

    expect(result).toBeTrue();
  });

  describe('isCurrentFlowAnyImplicitFlow', () => {
    it('returns true if currentFlowIsImplicitFlowWithAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(true);
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow();

      expect(result).toBeTrue();
    });

    it('returns true if isCurrentFlowImplicitFlowWithoutAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(true);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow();

      expect(result).toBeTrue();
    });

    it('returns false it is not any implicit flow', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow();

      expect(result).toBeFalse();
    });
  });
});

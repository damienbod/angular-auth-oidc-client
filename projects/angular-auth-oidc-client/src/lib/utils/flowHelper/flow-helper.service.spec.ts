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

        configProvider.setConfig(config, null);

        expect(flowHelper.isCurrentFlowCodeFlow()).toBeFalse();
    });

    it('isCurrentFlowCodeFlow returns true if current flow is code flow', () => {
        const config = { responseType: 'code' };

        configProvider.setConfig(config, null);

        expect(flowHelper.isCurrentFlowCodeFlow()).toBeTrue();
    });

    it('currentFlowIs returns true if current flow is code flow', () => {
        const config = { responseType: 'code' };

        configProvider.setConfig(config, null);

        expect(flowHelper.currentFlowIs('code')).toBeTrue();
    });

    it('currentFlowIs returns true if current flow is code flow (array)', () => {
        const config = { responseType: 'code' };

        configProvider.setConfig(config, null);

        expect(flowHelper.currentFlowIs(['code'])).toBeTrue();
    });

    it('currentFlowIs returns true if current flow is id_token token or code (array)', () => {
        const config = { responseType: 'id_token token' };

        configProvider.setConfig(config, null);

        expect(flowHelper.currentFlowIs(['id_token token', 'code'])).toBeTrue();
    });

    it('currentFlowIs returns true if current flow is code flow', () => {
        const config = { responseType: 'id_token token' };

        configProvider.setConfig(config, null);

        expect(flowHelper.currentFlowIs('code')).toBeFalse();
    });

    it('isCurrentFlowImplicitFlowWithAccessToken return true if flow is "id_token token"', () => {
        const config = { responseType: 'id_token token' };

        configProvider.setConfig(config, null);
        const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken();

        expect(result).toBeTrue();
    });

    it('isCurrentFlowImplicitFlowWithAccessToken return false if flow is not "id_token token"', () => {
        const config = { responseType: 'id_token2 token2' };

        configProvider.setConfig(config, null);
        const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken();

        expect(result).toBeFalse();
    });

    it('isCurrentFlowImplicitFlowWithoutAccessToken return true if flow is "id_token"', () => {
        const config = { responseType: 'id_token' };

        configProvider.setConfig(config, null);
        const result = flowHelper.isCurrentFlowImplicitFlowWithoutAccessToken();

        expect(result).toBeTrue();
    });

    it('isCurrentFlowImplicitFlowWithoutAccessToken return false if flow is not "id_token token"', () => {
        const config = { responseType: 'id_token2' };

        configProvider.setConfig(config, null);
        const result = flowHelper.isCurrentFlowImplicitFlowWithoutAccessToken();

        expect(result).toBeFalse();
    });

    it('isCurrentFlowCodeFlowWithRefeshTokens return false if flow is not code flow', () => {
        const config = { responseType: 'not code' };

        configProvider.setConfig(config, null);
        const result = flowHelper.isCurrentFlowCodeFlowWithRefeshTokens();

        expect(result).toBeFalse();
    });

    it('isCurrentFlowCodeFlowWithRefeshTokens return false if useRefreshToken is set to false', () => {
        const config = { responseType: 'not code', useRefreshToken: false };

        configProvider.setConfig(config, null);
        const result = flowHelper.isCurrentFlowCodeFlowWithRefeshTokens();

        expect(result).toBeFalse();
    });

    it('isCurrentFlowCodeFlowWithRefeshTokens return true if useRefreshToken is set to true and code flow', () => {
        const config = { responseType: 'code', useRefreshToken: true };

        configProvider.setConfig(config, null);
        const result = flowHelper.isCurrentFlowCodeFlowWithRefeshTokens();

        expect(result).toBeTrue();
    });
});

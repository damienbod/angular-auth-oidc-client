import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../../config';
import { FlowHelper } from './flow-helper.service';

fdescribe('Logger Service', () => {
    let configProvider: ConfigurationProvider;
    let flowHelper: FlowHelper;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConfigurationProvider, FlowHelper],
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

    it('currentFlowIs returns true if current flow is code flow', () => {
        const config = { responseType: 'id_token token' };

        configProvider.setConfig(config, null);

        expect(flowHelper.currentFlowIs('code')).toBeFalse();
    });
});

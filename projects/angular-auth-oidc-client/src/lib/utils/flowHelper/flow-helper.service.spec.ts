import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FlowHelper } from './flow-helper.service';

describe('Flow Helper Service', () => {
  let flowHelper: FlowHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FlowHelper],
    });
  });

  beforeEach(() => {
    flowHelper = TestBed.inject(FlowHelper);
  });

  it('should create', () => {
    expect(flowHelper).toBeTruthy();
  });

  it('should return false from isCurrentFlowCodeFlow if the current flow is not code flow', () => {
    const config = { responseType: 'id_token token', configId: 'configId1' };

    expect(flowHelper.isCurrentFlowCodeFlow(config)).toBe(false);
  });

  it('should return true from isCurrentFlowCodeFlow if the current flow is code flow', () => {
    const config = { responseType: 'code' };

    expect(flowHelper.isCurrentFlowCodeFlow(config)).toBe(true);
  });

  it('should return true from currentFlowIs if the current flow is code flow', () => {
    const config = { responseType: 'code' };

    expect(flowHelper.currentFlowIs('code', config)).toBe(true);
  });

  it('should return true from currentFlowIs if the current flow is code flow (array)', () => {
    const config = { responseType: 'code' };

    expect(flowHelper.currentFlowIs(['code'], config)).toBe(true);
  });

  it('should return true from currentFlowIs if the current flow is id_token token or code (array)', () => {
    const config = { responseType: 'id_token token' };

    expect(flowHelper.currentFlowIs(['id_token token', 'code'], config)).toBe(
      true
    );
  });

  it('should return false from currentFlowIs if the current flow is not code flow', () => {
    const config = { responseType: 'id_token token' };

    expect(flowHelper.currentFlowIs('code', config)).toBe(false);
  });

  it('should return true from isCurrentFlowImplicitFlowWithAccessToken if the flow is "id_token token"', () => {
    const config = { responseType: 'id_token token' };
    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken(config);

    expect(result).toBe(true);
  });

  it('should return false from isCurrentFlowImplicitFlowWithAccessToken if the flow is not "id_token token"', () => {
    const config = { responseType: 'id_token2 token2' };
    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken(config);

    expect(result).toBe(false);
  });

  it('should return false from isCurrentFlowCodeFlowWithRefreshTokens if the configuration is null', () => {
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(null);

    expect(result).toBe(false);
  });

  it('should return false from isCurrentFlowCodeFlowWithRefreshTokens if the flow is not code flow', () => {
    const config = { responseType: 'not code' };
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config);

    expect(result).toBe(false);
  });

  it('should return false from isCurrentFlowCodeFlowWithRefreshTokens if useRefreshToken is false', () => {
    const config = { responseType: 'code', useRefreshToken: false };
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config);

    expect(result).toBe(false);
  });

  it('should return true from isCurrentFlowCodeFlowWithRefreshTokens if useRefreshToken is true and the flow is code flow', () => {
    const config = { responseType: 'code', useRefreshToken: true };
    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config);

    expect(result).toBe(true);
  });

  describe('isCurrentFlowAnyImplicitFlow', () => {
    it('should return true if the flow is "id_token token"', () => {
      const result = flowHelper.isCurrentFlowAnyImplicitFlow({
        configId: 'configId1',
        responseType: 'id_token token',
      });

      expect(result).toBe(true);
    });

    it('should return true if the flow is "id_token"', () => {
      const result = flowHelper.isCurrentFlowAnyImplicitFlow({
        configId: 'configId1',
        responseType: 'id_token',
      });

      expect(result).toBe(true);
    });

    it('should return false if the flow is code flow', () => {
      const result = flowHelper.isCurrentFlowAnyImplicitFlow({
        configId: 'configId1',
        responseType: 'code',
      });

      expect(result).toBe(false);
    });

    it('should return false if the flow is neither "id_token token" nor "id_token"', () => {
      const result = flowHelper.isCurrentFlowAnyImplicitFlow({
        configId: 'configId1',
        responseType: 'id_token2',
      });

      expect(result).toBe(false);
    });
  });
});

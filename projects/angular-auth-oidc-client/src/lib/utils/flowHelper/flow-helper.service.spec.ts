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

  it('isCurrentFlowCodeFlow returns false if current flow is not code flow', () => {
    const config = { responseType: 'id_token token', configId: 'configId1' };

    expect(flowHelper.isCurrentFlowCodeFlow(config)).toBeFalse();
  });

  it('isCurrentFlowCodeFlow returns true if current flow is code flow', () => {
    const config = { responseType: 'code' };

    expect(flowHelper.isCurrentFlowCodeFlow(config)).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow', () => {
    const config = { responseType: 'code' };

    expect(flowHelper.currentFlowIs('code', config)).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow (array)', () => {
    const config = { responseType: 'code' };

    expect(flowHelper.currentFlowIs(['code'], config)).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is id_token token or code (array)', () => {
    const config = { responseType: 'id_token token' };

    expect(flowHelper.currentFlowIs(['id_token token', 'code'], config)).toBeTrue();
  });

  it('currentFlowIs returns true if current flow is code flow', () => {
    const config = { responseType: 'id_token token' };

    expect(flowHelper.currentFlowIs('code', config)).toBeFalse();
  });

  it('isCurrentFlowImplicitFlowWithAccessToken return true if flow is "id_token token"', () => {
    const config = { responseType: 'id_token token' };

    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken(config);

    expect(result).toBeTrue();
  });

  it('isCurrentFlowImplicitFlowWithAccessToken return false if flow is not "id_token token"', () => {
    const config = { responseType: 'id_token2 token2' };

    const result = flowHelper.isCurrentFlowImplicitFlowWithAccessToken(config);

    expect(result).toBeFalse();
  });

  it('isCurrentFlowImplicitFlowWithoutAccessToken return true if flow is "id_token"', () => {
    const config = { responseType: 'id_token' };

    const result = (flowHelper as any).isCurrentFlowImplicitFlowWithoutAccessToken(config);

    expect(result).toBeTrue();
  });

  it('isCurrentFlowImplicitFlowWithoutAccessToken return false if flow is not "id_token token"', () => {
    const config = { responseType: 'id_token2' };

    const result = (flowHelper as any).isCurrentFlowImplicitFlowWithoutAccessToken(config);

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return false if flow is not code flow', () => {
    const config = { responseType: 'not code' };

    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config);

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return false if useRefreshToken is set to false', () => {
    const config = { responseType: 'not code', useRefreshToken: false };

    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config);

    expect(result).toBeFalse();
  });

  it('isCurrentFlowCodeFlowWithRefreshTokens return true if useRefreshToken is set to true and code flow', () => {
    const config = { responseType: 'code', useRefreshToken: true };

    const result = flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config);

    expect(result).toBeTrue();
  });

  describe('isCurrentFlowAnyImplicitFlow', () => {
    it('returns true if currentFlowIsImplicitFlowWithAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(true);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow({ configId: 'configId1' });

      expect(result).toBeTrue();
    });

    it('returns true if isCurrentFlowImplicitFlowWithoutAccessToken is true', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(true);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow({ configId: 'configId1' });

      expect(result).toBeTrue();
    });

    it('returns false it is not any implicit flow', () => {
      spyOn(flowHelper, 'isCurrentFlowImplicitFlowWithAccessToken').and.returnValue(false);
      spyOn(flowHelper as any, 'isCurrentFlowImplicitFlowWithoutAccessToken').and.returnValue(false);

      const result = flowHelper.isCurrentFlowAnyImplicitFlow({ configId: 'configId1' });

      expect(result).toBeFalse();
    });
  });
});

import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { JsrsAsignReducedService } from './jsrsasign-reduced.service';

describe('TokenValidationService', () => {
  let spec: SpectatorService<JsrsAsignReducedService>;
  let service: JsrsAsignReducedService;

  const createService = createServiceFactory({
    service: JsrsAsignReducedService,
  });

  beforeEach(() => {
    spec = createService();
    service = spec.service;
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('generateCodeChallenge', () => {
    it('returns good result with correct codeVerifier', () => {
      const result = service.generateCodeChallenge('44445543344242132145455aaabbdc3b4');
      expect(result).toEqual('R2TWD45Vtcf_kfAqjuE3LMSRF3JDE5fsFndnn6-a0nQ');
    });
  });
});

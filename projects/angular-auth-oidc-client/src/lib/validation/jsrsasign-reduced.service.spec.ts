import { TestBed } from '@angular/core/testing';
import { JsrsAsignReducedService } from './jsrsasign-reduced.service';

describe('JsrsAsignReducedService', () => {
  let service: JsrsAsignReducedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [JsrsAsignReducedService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(JsrsAsignReducedService);
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

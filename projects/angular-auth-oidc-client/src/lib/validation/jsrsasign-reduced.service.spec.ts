import { TestBed } from '@angular/core/testing';
import { JsrsAsignReducedService } from './jsrsasign-reduced.service';
import { TestScheduler } from 'rxjs/testing';

describe('JsrsAsignReducedService', () => {
  let service: JsrsAsignReducedService;
  let testScheduler: TestScheduler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [JsrsAsignReducedService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(JsrsAsignReducedService);
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toBe(expected);
    });
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('generateCodeChallenge', () => {
    it('returns good result with correct codeVerifier', () => {
      const outcome = 'R2TWD45Vtcf_kfAqjuE3LMSRF3JDE5fsFndnn6-a0nQ';
      const observable = service.generateCodeChallenge('44445543344242132145455aaabbdc3b4');

      observable.subscribe(value => {
        expect(value).toBe(outcome);
      });
    });
  });
});

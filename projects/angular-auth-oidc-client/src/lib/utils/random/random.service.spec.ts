import { TestBed } from '@angular/core/testing';
import { RandomService } from './random.service';

describe('RandonService Tests', () => {
    let randomService: RandomService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RandomService],
        });
    });

    beforeEach(() => {
        randomService = TestBed.inject(RandomService);
    });

    it('should create', () => {
        expect(randomService).toBeTruthy();
    });

    it('should be not equal', () => {
        const result = randomService.createRandom(45);
        const result2 = randomService.createRandom(45);
        expect(result === result2).toBeFalse();
    });
});

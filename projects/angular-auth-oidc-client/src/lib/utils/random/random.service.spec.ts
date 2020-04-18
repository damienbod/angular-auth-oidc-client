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
        const r1 = randomService.createRandom(45);
        const r2 = randomService.createRandom(45);
        const result = r1 === r2;
        expect(result).toBeFalse();
    });

    it('correct length', () => {
        const r1 = randomService.createRandom(79);
        const result = r1.length;
        expect(result).toBe(79);
    });

    it('correct length', () => {
        const r1 = randomService.createRandom(7);
        const result = r1.length;
        expect(result).toBe(7);
    });
});

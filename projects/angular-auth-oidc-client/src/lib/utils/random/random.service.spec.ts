import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { RandomService } from './random.service';

describe('RandomService Tests', () => {
    let randomService: RandomService;
    let loggerService: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RandomService, { provide: LoggerService, useClass: LoggerServiceMock }],
        });
    });

    beforeEach(() => {
        randomService = TestBed.inject(RandomService);
        loggerService = TestBed.inject(LoggerService);
    });

    it('should create', () => {
        expect(randomService).toBeTruthy();
    });

    it('should be not equal', () => {
        const r1 = randomService.createRandom(45);
        const r2 = randomService.createRandom(45);
        expect(r1).not.toEqual(r2);
    });

    it('correct length with high number', () => {
        const r1 = randomService.createRandom(79);
        const result = r1.length;
        expect(result).toBe(79);
    });

    it('correct length with small number', () => {
        const r1 = randomService.createRandom(7);
        const result = r1.length;
        expect(result).toBe(7);
    });

    it('correct length with 0', () => {
        const r1 = randomService.createRandom(0);
        const result = r1.length;
        expect(result).toBe(0);
        expect(r1).toBe('');
    });

    // fit('correct length with smaller than 7 ==> 6', () => {
    //     const requiredLengthSmallerThenSeven = 6;
    //     const minimumlength = 7;
    //     const r1 = randomService.createRandom(requiredLengthSmallerThenSeven);
    //     spyOn(loggerService, 'logWarning').and.callThrough();
    //     expect(r1.length).toBe(minimumlength);
    //     expect(loggerService.logWarning).toHaveBeenCalledWith(
    //         `RandomService called with ${requiredLengthSmallerThenSeven} but 7 chars is the minimum, returning 7 chars`
    //     );
    // });
});

import { TestBed } from '@angular/core/testing';
import { TokenHelperService } from '../../src/services/oidc-token-helper.service';

describe('TokenHelperService', () => {
    let tokenHelperService: TokenHelperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TokenHelperService],
        });
    });

    beforeEach(() => {
        tokenHelperService = TestBed.get(TokenHelperService);
    });

    it('should create', () => {
        expect(tokenHelperService).toBeTruthy();
    });
});

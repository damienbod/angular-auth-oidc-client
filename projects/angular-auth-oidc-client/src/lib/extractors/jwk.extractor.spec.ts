import { TestBed } from '@angular/core/testing';
import { CryptoService } from '../utils/crypto/crypto-service';
import { JwkExtractor } from './jwk.extractor';

describe('JwkExtractor', () => {
  let service: JwkExtractor;
  let keys: JsonWebKey[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [JwkExtractor, CryptoService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(JwkExtractor);
    keys = [{
      "kty": "RSA",
      "use": "sig",
      "kid": "5626CE6A8F4F5FCD79C6642345282CA76D337548RS256",
      "x5t": "VibOao9PX815xmQjRSgsp20zdUg",
      "e": "AQAB",
      "n": "uu3-HK4pLRHJHoEBzFhM516RWx6nybG5yQjH4NbKjfGQ8dtKy1BcGjqfMaEKF8KOK44NbAx7rtBKCO9EKNYkeFvcUzBzVeuu4jWG61XYdTekgv-Dh_Fj8245GocEkbvBbFW6cw-_N59JWqUuiCvb-EOfhcuubUcr44a0AQyNccYNpcXGRcMKy7_L1YhO0AMULqLDDVLFj5glh4TcJ2N5VnJedq1-_JKOxPqD1ni26UOQoWrW16G29KZ1_4Xxf2jX8TAq-4RJEHccdzgZVIO4F5B4MucMZGq8_jMCpiTUsUGDOAMA_AmjxIRHOtO5n6Pt0wofrKoAVhGh2sCTtaQf2Q",
      "x5c": [
        "MIIDPzCCAiegAwIBAgIQF+HRVxLHII9IlOoQk6BxcjANBgkqhkiG9w0BAQsFADAbMRkwFwYDVQQDDBBzdHMuZGV2LmNlcnQuY29tMB4XDTE5MDIyMDEwMTA0M1oXDTM5MDIyMDEwMTkyOVowGzEZMBcGA1UEAwwQc3RzLmRldi5jZXJ0LmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALrt/hyuKS0RyR6BAcxYTOdekVsep8mxuckIx+DWyo3xkPHbSstQXBo6nzGhChfCjiuODWwMe67QSgjvRCjWJHhb3FMwc1XrruI1hutV2HU3pIL/g4fxY/NuORqHBJG7wWxVunMPvzefSVqlLogr2/hDn4XLrm1HK+OGtAEMjXHGDaXFxkXDCsu/y9WITtADFC6iww1SxY+YJYeE3CdjeVZyXnatfvySjsT6g9Z4tulDkKFq1tehtvSmdf+F8X9o1/EwKvuESRB3HHc4GVSDuBeQeDLnDGRqvP4zAqYk1LFBgzgDAPwJo8SERzrTuZ+j7dMKH6yqAFYRodrAk7WkH9kCAwEAAaN/MH0wDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAtBgNVHREEJjAkghBzdHMuZGV2LmNlcnQuY29tghBzdHMuZGV2LmNlcnQuY29tMB0GA1UdDgQWBBQuyHxWP3je6jGMOmOiY+hz47r36jANBgkqhkiG9w0BAQsFAAOCAQEAKEHG7Ga6nb2XiHXDc69KsIJwbO80+LE8HVJojvITILz3juN6/FmK0HmogjU6cYST7m1MyxsVhQQNwJASZ6haBNuBbNzBXfyyfb4kr62t1oDLNwhctHaHaM4sJSf/xIw+YO+Qf7BtfRAVsbM05+QXIi2LycGrzELiXu7KFM0E1+T8UOZ2Qyv7OlCb/pWkYuDgE4w97ox0MhDpvgluxZLpRanOLUCVGrfFaij7gRAhjYPUY3vAEcD8JcFBz1XijU8ozRO6FaG4qg8/JCe+VgoWsMDj3sKB9g0ob6KCyG9L2bdk99PGgvXDQvMYCpkpZzG3XsxOINPd5p0gc209ZOoxTg=="
      ],
      "alg": "RS256"
    } as JsonWebKey, {
      "kty": "RSA",
      "kid": "boop",
      "n": "wq0vJv4Xl2xSQTN75_N4JeFHlHH80PytypJqyNrhWIp1P9Ur4-5QSiS8BI8PYSh0dQy4NMoj9YMRcyge3y81uCCwxouePiAGc0xPy6QkAOiinvV3KJEMtbppicOvZEzMXb3EqRM-9Twxbp2hhBAPSAhyL79Rwy4JuIQ6imaqL0NIEGv8_BOe_twMPOLGTJhepDO6kDs6O0qlLgPRHQVuKAz3afVby0C2myDLpo5YaI66arU9VXXGQtIp8MhBY9KbsGaYskejSWhSBOcwdtYMEo5rXWGGVnrHiSqq8mm-sVXLQBe5xPFBs4IQ_Gz4nspr05LEEbsHSwFyGq5D77XPxGUPDCq5ZVvON0yBizaHcJ-KA0Lw6uXtOH9-YyVGuaBynkrQEo3pP2iy1uWt-TiQPb8PMsCAdWZP-6R0QKHtjds9HmjIkgFTJSTIeETjNck_bB4ud79gZT-INikjPFTTeyQYk2jqxEJanVe3k0i_1vpskRpknJ7F2vTL45LAQkjWvczjWmHxGA5D4-1msuylXpY8Y4WxnUq6dRTEN29IRVCil9Mfp6JMsquFGTvJO0-Ffl0_suMZZl3uXNt23E9vGreByalWHivYmfpIor5Q5JaFKekRVV-U1KDBaeQQaHp_VqliUKImdUE9-GXNOIaBMjRvfy0nxsRe_q_dD6jc_GU",
      "e": "AQAB"
    } as JsonWebKey, {
      "kty": "RSA",
      "use": "enc",
      "kid": "boop",
      "n": "wq0vJv4Xl2xSQTN75_N4JeFHlHH80PytypJqyNrhWIp1P9Ur4-5QSiS8BI8PYSh0dQy4NMoj9YMRcyge3y81uCCwxouePiAGc0xPy6QkAOiinvV3KJEMtbppicOvZEzMXb3EqRM-9Twxbp2hhBAPSAhyL79Rwy4JuIQ6imaqL0NIEGv8_BOe_twMPOLGTJhepDO6kDs6O0qlLgPRHQVuKAz3afVby0C2myDLpo5YaI66arU9VXXGQtIp8MhBY9KbsGaYskejSWhSBOcwdtYMEo5rXWGGVnrHiSqq8mm-sVXLQBe5xPFBs4IQ_Gz4nspr05LEEbsHSwFyGq5D77XPxGUPDCq5ZVvON0yBizaHcJ-KA0Lw6uXtOH9-YyVGuaBynkrQEo3pP2iy1uWt-TiQPb8PMsCAdWZP-6R0QKHtjds9HmjIkgFTJSTIeETjNck_bB4ud79gZT-INikjPFTTeyQYk2jqxEJanVe3k0i_1vpskRpknJ7F2vTL45LAQkjWvczjWmHxGA5D4-1msuylXpY8Y4WxnUq6dRTEN29IRVCil9Mfp6JMsquFGTvJO0-Ffl0_suMZZl3uXNt23E9vGreByalWHivYmfpIor5Q5JaFKekRVV-U1KDBaeQQaHp_VqliUKImdUE9-GXNOIaBMjRvfy0nxsRe_q_dD6jc_GU",
      "e": "AQAB"
    } as JsonWebKey, {
      "kty": "RSA",
      "use": "sig",
      "kid": "boop",
      "n": "wq0vJv4Xl2xSQTN75_N4JeFHlHH80PytypJqyNrhWIp1P9Ur4-5QSiS8BI8PYSh0dQy4NMoj9YMRcyge3y81uCCwxouePiAGc0xPy6QkAOiinvV3KJEMtbppicOvZEzMXb3EqRM-9Twxbp2hhBAPSAhyL79Rwy4JuIQ6imaqL0NIEGv8_BOe_twMPOLGTJhepDO6kDs6O0qlLgPRHQVuKAz3afVby0C2myDLpo5YaI66arU9VXXGQtIp8MhBY9KbsGaYskejSWhSBOcwdtYMEo5rXWGGVnrHiSqq8mm-sVXLQBe5xPFBs4IQ_Gz4nspr05LEEbsHSwFyGq5D77XPxGUPDCq5ZVvON0yBizaHcJ-KA0Lw6uXtOH9-YyVGuaBynkrQEo3pP2iy1uWt-TiQPb8PMsCAdWZP-6R0QKHtjds9HmjIkgFTJSTIeETjNck_bB4ud79gZT-INikjPFTTeyQYk2jqxEJanVe3k0i_1vpskRpknJ7F2vTL45LAQkjWvczjWmHxGA5D4-1msuylXpY8Y4WxnUq6dRTEN29IRVCil9Mfp6JMsquFGTvJO0-Ffl0_suMZZl3uXNt23E9vGreByalWHivYmfpIor5Q5JaFKekRVV-U1KDBaeQQaHp_VqliUKImdUE9-GXNOIaBMjRvfy0nxsRe_q_dD6jc_GU",
      "e": "AQAB"
    } as JsonWebKey];
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('extractJwk', () => {
    it('throws error if no keys are present in array', () => {
        expect(() => {
          service.extractJwk([]);
        }).toThrowError();
      }
    );

    it('throws error if keyId is present, but no key was matching', () => {
        expect(() => {
          service.extractJwk(keys, 'doot');
        }).toThrowError();
      }
    );

    it('throws error if use is present, but no key was matching', () => {
        expect(() => {
          service.extractJwk(keys, null, 'blorp');
        }).toThrowError();
      }
    );

    it('throws error if multiple keys are present, and neither keyId nor use is present', () => {
        expect(() => {
          service.extractJwk(keys);
        }).toThrowError();
      }
    );

    it('returns first key matching keyId', () => {
        const extracted = service.extractJwk(keys.slice(0, 1), '5626CE6A8F4F5FCD79C6642345282CA76D337548RS256');

        expect(extracted).toEqual(keys[0]);

        const extracted2 = service.extractJwk(keys, 'boop');

        expect(extracted2).toEqual(keys[1]);
      }
    );

    it('returns first key that matches intended use if keyId is not present', () => {
        const extracted = service.extractJwk(keys, null, 'sig');

        expect(extracted).toEqual(keys[0]);

        const extracted2 = service.extractJwk(keys, null, 'enc');

        expect(extracted2).toEqual(keys[2]);
      }
    );

    it('returns first key that matches the combination of intended use and keyId', () => {
        const extracted = service.extractJwk(keys, 'boop', 'sig');

        expect(extracted).toEqual(keys[3]);

        const extracted2 = service.extractJwk(keys, 'boop', 'enc');

        expect(extracted2).toEqual(keys[2]);
      }
    );
  });
});

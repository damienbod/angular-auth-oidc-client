import { TestBed, waitForAsync } from '@angular/core/testing';
import { base64url } from 'rfc4648';
import { CryptoService } from '../utils/crypto/crypto.service';
import { JwkWindowCryptoService } from './jwk-window-crypto.service';

describe('JwkWindowCryptoService', () => {
  let service: JwkWindowCryptoService;
  const alg = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: 'SHA-256',
  };
  const key1 = {
    kty: 'RSA',
    use: 'sig',
    kid: '5626CE6A8F4F5FCD79C6642345282CA76D337548RS256',
    x5t: 'VibOao9PX815xmQjRSgsp20zdUg',
    e: 'AQAB',
    n: 'uu3-HK4pLRHJHoEBzFhM516RWx6nybG5yQjH4NbKjfGQ8dtKy1BcGjqfMaEKF8KOK44NbAx7rtBKCO9EKNYkeFvcUzBzVeuu4jWG61XYdTekgv-Dh_Fj8245GocEkbvBbFW6cw-_N59JWqUuiCvb-EOfhcuubUcr44a0AQyNccYNpcXGRcMKy7_L1YhO0AMULqLDDVLFj5glh4TcJ2N5VnJedq1-_JKOxPqD1ni26UOQoWrW16G29KZ1_4Xxf2jX8TAq-4RJEHccdzgZVIO4F5B4MucMZGq8_jMCpiTUsUGDOAMA_AmjxIRHOtO5n6Pt0wofrKoAVhGh2sCTtaQf2Q',
    x5c: [
      'MIIDPzCCAiegAwIBAgIQF+HRVxLHII9IlOoQk6BxcjANBgkqhkiG9w0BAQsFADAbMRkwFwYDVQQDDBBzdHMuZGV2LmNlcnQuY29tMB4XDTE5MDIyMDEwMTA0M1oXDTM5MDIyMDEwMTkyOVowGzEZMBcGA1UEAwwQc3RzLmRldi5jZXJ0LmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALrt/hyuKS0RyR6BAcxYTOdekVsep8mxuckIx+DWyo3xkPHbSstQXBo6nzGhChfCjiuODWwMe67QSgjvRCjWJHhb3FMwc1XrruI1hutV2HU3pIL/g4fxY/NuORqHBJG7wWxVunMPvzefSVqlLogr2/hDn4XLrm1HK+OGtAEMjXHGDaXFxkXDCsu/y9WITtADFC6iww1SxY+YJYeE3CdjeVZyXnatfvySjsT6g9Z4tulDkKFq1tehtvSmdf+F8X9o1/EwKvuESRB3HHc4GVSDuBeQeDLnDGRqvP4zAqYk1LFBgzgDAPwJo8SERzrTuZ+j7dMKH6yqAFYRodrAk7WkH9kCAwEAAaN/MH0wDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAtBgNVHREEJjAkghBzdHMuZGV2LmNlcnQuY29tghBzdHMuZGV2LmNlcnQuY29tMB0GA1UdDgQWBBQuyHxWP3je6jGMOmOiY+hz47r36jANBgkqhkiG9w0BAQsFAAOCAQEAKEHG7Ga6nb2XiHXDc69KsIJwbO80+LE8HVJojvITILz3juN6/FmK0HmogjU6cYST7m1MyxsVhQQNwJASZ6haBNuBbNzBXfyyfb4kr62t1oDLNwhctHaHaM4sJSf/xIw+YO+Qf7BtfRAVsbM05+QXIi2LycGrzELiXu7KFM0E1+T8UOZ2Qyv7OlCb/pWkYuDgE4w97ox0MhDpvgluxZLpRanOLUCVGrfFaij7gRAhjYPUY3vAEcD8JcFBz1XijU8ozRO6FaG4qg8/JCe+VgoWsMDj3sKB9g0ob6KCyG9L2bdk99PGgvXDQvMYCpkpZzG3XsxOINPd5p0gc209ZOoxTg==',
    ],
    alg: 'RS256',
  } as JsonWebKey;
  const key2 = {
    kty: 'RSA',
    n: 'wq0vJv4Xl2xSQTN75_N4JeFHlHH80PytypJqyNrhWIp1P9Ur4-5QSiS8BI8PYSh0dQy4NMoj9YMRcyge3y81uCCwxouePiAGc0xPy6QkAOiinvV3KJEMtbppicOvZEzMXb3EqRM-9Twxbp2hhBAPSAhyL79Rwy4JuIQ6imaqL0NIEGv8_BOe_twMPOLGTJhepDO6kDs6O0qlLgPRHQVuKAz3afVby0C2myDLpo5YaI66arU9VXXGQtIp8MhBY9KbsGaYskejSWhSBOcwdtYMEo5rXWGGVnrHiSqq8mm-sVXLQBe5xPFBs4IQ_Gz4nspr05LEEbsHSwFyGq5D77XPxGUPDCq5ZVvON0yBizaHcJ-KA0Lw6uXtOH9-YyVGuaBynkrQEo3pP2iy1uWt-TiQPb8PMsCAdWZP-6R0QKHtjds9HmjIkgFTJSTIeETjNck_bB4ud79gZT-INikjPFTTeyQYk2jqxEJanVe3k0i_1vpskRpknJ7F2vTL45LAQkjWvczjWmHxGA5D4-1msuylXpY8Y4WxnUq6dRTEN29IRVCil9Mfp6JMsquFGTvJO0-Ffl0_suMZZl3uXNt23E9vGreByalWHivYmfpIor5Q5JaFKekRVV-U1KDBaeQQaHp_VqliUKImdUE9-GXNOIaBMjRvfy0nxsRe_q_dD6jc_GU',
    e: 'AQAB',
  } as JsonWebKey;
  const key3 = {
    kty: 'RSA',
    n: 'u1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0_IzW7yWR7QkrmBL7jTKEn5u-qKhbwKfBstIs-bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyehkd3qqGElvW_VDL5AaWTg0nLVkjRo9z-40RQzuVaE8AkAFmxZzow3x-VJYKdjykkJ0iT9wCS0DRTXu269V264Vf_3jvredZiKRkgwlL9xNAwxXFg0x_XFw005UWVRIkdgcKWTjpBP2dPwVZ4WWC-9aGVd-Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbcmw',
    e: 'AQAB',
    alg: 'RS256',
    kid: 'boop',
    use: 'sig',
  } as JsonWebKey;
  const keys: JsonWebKey[] = [key1, key2, key3];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [JwkWindowCryptoService, CryptoService],
    });
  });

  beforeEach(waitForAsync(() => {
    service = TestBed.inject(JwkWindowCryptoService);
  }));

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('importVerificationKey', () => {
    it('returns instance of CryptoKey when valid input is provided', (done) => {
      const promises = keys.map((key) => service.importVerificationKey(key, alg));

      Promise.all(promises).then((values) => {
        values.forEach((value) => {
          expect(value).toBeInstanceOf(CryptoKey);
        });
        done();
      });
    });
  });

  describe('verifyKey', () => {
    it('returns true when valid input is provided', (done) => {
      const headerAndPayloadString =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0';
      const signatureString =
        'NHVaYe26MbtOYhSKkoKYdFVomg4i8ZJd8_-RU8VNbftc4TSMb4bXP3l3YlNWACwyXPGffz5aXHc6lty1Y2t4SWRqGteragsVdZufDn5BlnJl9pdR_kdVFUsra2rWKEofkZeIC4yWytE58sMIihvo9H1ScmmVwBcQP6XETqYd0aSHp1gOa9RdUPDvoXQ5oqygTqVtxaDr6wUFKrKItgBMzWIdNZ6y7O9E0DhEPTbE9rfBo6KTFsHAZnMg4k68CDp2woYIaXbmYTWcvbzIuHO7_37GT79XdIwkm95QJ7hYC9RiwrV7mesbY4PAahERJawntho0my942XheVLmGwLMBkQ';
      const signature: Uint8Array = base64url.parse(signatureString, { loose: true });

      service
        .importVerificationKey(key3, alg)
        .then((c) => service.verifyKey(alg, c, signature, headerAndPayloadString))
        .then((value) => {
          expect(value).toEqual(true);
        })
        .finally(() => {
          done();
        });
    });
  });
});

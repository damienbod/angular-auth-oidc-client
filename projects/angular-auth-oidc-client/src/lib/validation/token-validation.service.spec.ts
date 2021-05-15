// /* eslint-disable max-len */
// import { TestBed } from '@angular/core/testing';
// import { LoggerService } from '../logging/logger.service';
// import { LoggerServiceMock } from '../logging/logger.service-mock';
// import { TokenHelperService } from '../utils/tokenHelper/oidc-token-helper.service';
// import { TokenHelperServiceMock } from '../utils/tokenHelper/oidc-token-helper.service-mock';
// import { TokenValidationService } from './token-validation.service';

// describe('TokenValidationService', () => {
//   let tokenValidationService: TokenValidationService;
//   let tokenHelperService: TokenHelperService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       imports: [],
//       providers: [
//         {
//           provide: LoggerService,
//           useClass: LoggerServiceMock,
//         },
//         {
//           provide: TokenHelperService,
//           useClass: TokenHelperServiceMock,
//         },
//         TokenValidationService,
//       ],
//     });
//   });

//   beforeEach(() => {
//     tokenHelperService = TestBed.inject(TokenHelperService);
//     tokenValidationService = TestBed.inject(TokenValidationService);
//   });

//   it('should create', () => {
//     expect(tokenValidationService).toBeTruthy();
//   });

//   describe('validateIdTokenAud', () => {
//     it('returns true if aud is string and passed aud matches idToken.aud', () => {
//       const dataIdToken = { aud: 'banana' };
//       const valueTrue = tokenValidationService.validateIdTokenAud(dataIdToken, 'banana');
//       expect(valueTrue).toEqual(true);
//     });

//     it('returns false if aud is string and passed aud does not match idToken.aud', () => {
//       const dataIdToken = { aud: 'banana' };

//       const valueFalse = tokenValidationService.validateIdTokenAud(dataIdToken, 'bananammmm');
//       expect(valueFalse).toEqual(false);
//     });

//     it('returns true if aud is string array and passed aud is included in the array', () => {
//       const dataIdToken = {
//         aud: ['banana', 'apple', 'https://nice.dom'],
//       };

//       const audValidTrue = tokenValidationService.validateIdTokenAud(dataIdToken, 'apple');

//       expect(audValidTrue).toEqual(true);
//     });

//     it('returns false if aud is string array and passed aud is NOT included in the array', () => {
//       const dataIdToken = {
//         aud: ['banana', 'apple', 'https://nice.dom'],
//       };

//       const audValidFalse = tokenValidationService.validateIdTokenAud(dataIdToken, 'https://nice.domunnnnnnkoem');

//       expect(audValidFalse).toEqual(false);
//     });
//   });

//   describe('validateIdTokenNonce', () => {
//     it('should validate id token nonce after code grant when match', () => {
//       expect(tokenValidationService.validateIdTokenNonce({ nonce: 'test1' }, 'test1', false)).toBe(true);
//     });

//     it('should not validate id token nonce after code grant when no match', () => {
//       expect(tokenValidationService.validateIdTokenNonce({ nonce: 'test1' }, 'test2', false)).toBe(false);
//     });

//     it('should validate id token nonce after refresh token grant when undefined and no ignore', () => {
//       expect(
//         tokenValidationService.validateIdTokenNonce({ nonce: undefined }, TokenValidationService.refreshTokenNoncePlaceholder, false)
//       ).toBe(true);
//     });

//     it('should validate id token nonce after refresh token grant when undefined and ignore', () => {
//       expect(
//         tokenValidationService.validateIdTokenNonce({ nonce: undefined }, TokenValidationService.refreshTokenNoncePlaceholder, true)
//       ).toBe(true);
//     });

//     it('should validate id token nonce after refresh token grant when defined and ignore', () => {
//       expect(
//         tokenValidationService.validateIdTokenNonce({ nonce: 'test1' }, TokenValidationService.refreshTokenNoncePlaceholder, true)
//       ).toBe(true);
//     });

//     it('should not validate id token nonce after refresh token grant when defined and no ignore', () => {
//       expect(
//         tokenValidationService.validateIdTokenNonce({ nonce: 'test1' }, TokenValidationService.refreshTokenNoncePlaceholder, false)
//       ).toBe(false);
//     });
//   });

//   describe('validateIdTokenAzpExistsIfMoreThanOneAud', () => {
//     it('returns false if aud is array, öength is bigger than 1 and has no azp property', () => {
//       const dataIdToken = {
//         aud: ['one', 'two'],
//       };
//       const result = tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);
//       expect(result).toBe(false);
//     });

//     it('returns false if aud is array, ength is bigger than 1 and has no azp property', () => {
//       const result = tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(null);
//       expect(result).toBe(false);
//     });
//   });

//   describe('validateIdTokenAzpValid', () => {
//     it('returns true dataIdToken param is null', () => {
//       const result = tokenValidationService.validateIdTokenAzpValid(null, '');
//       expect(result).toBe(true);
//     });

//     it('returns false when aud is an array and client id is NOT in the aud array', () => {
//       const dataIdToken = {
//         aud: ['banana', 'apple', '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com'],
//         azp: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
//       };

//       const azpInvalid = tokenValidationService.validateIdTokenAzpValid(dataIdToken, 'bananammmm');
//       expect(azpInvalid).toEqual(false);
//     });

//     it('returns true when aud is an array and client id is in the aud array', () => {
//       const dataIdToken = {
//         aud: ['banana', 'apple', '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com'],
//         azp: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
//       };

//       const azpValid = tokenValidationService.validateIdTokenAzpValid(
//         dataIdToken,
//         '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com'
//       );
//       expect(azpValid).toEqual(true);
//     });

//     it('returns true if ID token has no azp property', () => {
//       const dataIdToken = {
//         noAzpProperty: 'something',
//       };

//       const azpValid = tokenValidationService.validateIdTokenAzpValid(dataIdToken, 'bananammmm');
//       expect(azpValid).toEqual(true);
//     });
//   });

//   describe('validateIdTokenAzpExistsIfMoreThanOneAud', () => {
//     it('returns true if aud is array and aud contains azp', () => {
//       const dataIdToken = {
//         aud: ['banana', 'apple', '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com'],
//         azp: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
//       };

//       const valueTrue = tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);

//       expect(valueTrue).toEqual(true);
//     });

//     it('returns true if aud is array but only has one item', () => {
//       const dataIdToken = {
//         aud: ['banana'],
//       };

//       const valueTrue = tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);

//       expect(valueTrue).toEqual(true);
//     });

//     it('returns true if aud is NOT an array', () => {
//       const dataIdToken = {
//         aud: 'banana',
//       };
//       const valueTrue = tokenValidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);
//       expect(valueTrue).toEqual(true);
//     });
//   });

//   describe('validateRequiredIdToken', () => {
//     it('returns false if property iat is missing', () => {
//       const decodedIdToken = {
//         iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
//         sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
//         aud: 'bad',
//         exp: 1589210086,
//         // iat: 1589206486,
//       };

//       const result = tokenValidationService.validateRequiredIdToken(decodedIdToken);
//       expect(result).toEqual(false);
//     });

//     it('returns false if property exp is missing', () => {
//       const decodedIdToken = {
//         iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
//         sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
//         aud: 'bad',
//         // exp: 1589210086,
//         iat: 1589206486,
//       };

//       const result = tokenValidationService.validateRequiredIdToken(decodedIdToken);
//       expect(result).toEqual(false);
//     });

//     it('returns false if property aud is missing', () => {
//       const decodedIdToken = {
//         iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
//         sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
//         // aud: 'bad',
//         exp: 1589210086,
//         iat: 1589206486,
//       };

//       const result = tokenValidationService.validateRequiredIdToken(decodedIdToken);
//       expect(result).toEqual(false);
//     });

//     it('returns false if property sub is missing', () => {
//       const decodedIdToken = {
//         iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
//         // sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
//         aud: 'bad',
//         exp: 1589210086,
//         iat: 1589206486,
//       };

//       const result = tokenValidationService.validateRequiredIdToken(decodedIdToken);
//       expect(result).toEqual(false);
//     });

//     it('returns false if property iss is missing', () => {
//       const decodedIdToken = {
//         // iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
//         sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
//         aud: 'bad',
//         exp: 1589210086,
//         iat: 1589206486,
//       };

//       const result = tokenValidationService.validateRequiredIdToken(decodedIdToken);
//       expect(result).toEqual(false);
//     });

//     it('returns true if all is valid', () => {
//       const decodedIdToken = {
//         iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
//         sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
//         aud: 'bad',
//         exp: 1589210086,
//         iat: 1589206486,
//       };

//       const result = tokenValidationService.validateRequiredIdToken(decodedIdToken);
//       expect(result).toEqual(true);
//     });
//   });

//   describe('validateIdTokenIss', () => {
//     it('returns true if issuer matches iss in idToken', () => {
//       const decodedIdToken = {
//         iss: 'xc',
//       };

//       const valueTrue = tokenValidationService.validateIdTokenIss(decodedIdToken, 'xc');
//       expect(valueTrue).toEqual(true);
//     });

//     it('returns false if issuer does not match iss in idToken', () => {
//       const decodedIdToken = {
//         iss: 'xc',
//       };

//       const valueFalse = tokenValidationService.validateIdTokenIss(decodedIdToken, 'xcjjjj');
//       expect(valueFalse).toEqual(false);
//     });
//   });

//   describe('validateIdTokenIatMaxOffset', () => {
//     it('returns true if validationIsDisabled', () => {
//       const result = tokenValidationService.validateIdTokenIatMaxOffset(null, 0, true);

//       expect(result).toBe(true);
//     });

//     it('returns false if dataIdToken has no property "iat"', () => {
//       const dataIdToken = {
//         notIat: 'test',
//       };
//       const result = tokenValidationService.validateIdTokenIatMaxOffset(dataIdToken, 0, false);

//       expect(result).toBe(false);
//     });

//     it('returns true if time is Mon Jan 19 1970 10:26:46 GMT+0100, and the offset is big like 500000000000 seconds', () => {
//       const decodedIdToken = {
//         iat: 1589206486, // Mon Jan 19 1970 10:26:46 GMT+0100 (Central European Standard Time)
//       };

//       const valueTrue = tokenValidationService.validateIdTokenIatMaxOffset(decodedIdToken, 500000000000, false);
//       expect(valueTrue).toEqual(true);
//     });

//     it('returns false if time is Sat Nov 09 1985 02:47:57 GMT+0100, and the offset is 0 seconds', () => {
//       const decodedIdTokenNegIat = {
//         iat: 500348877430, // Sat Nov 09 1985 02:47:57 GMT+0100 (Central European Standard Time)
//       };
//       const valueFalseNeg = tokenValidationService.validateIdTokenIatMaxOffset(decodedIdTokenNegIat, 0, false);
//       expect(valueFalseNeg).toEqual(false);
//     });

//     it('returns true if time is Mon Jan 19 1970 10:26:46 GMT+0100, and the offset is small like 5 seconds', () => {
//       const decodedIdToken = {
//         iat: 1589206486, // Mon Jan 19 1970 10:26:46 GMT+0100 (Central European Standard Time)
//       };
//       const valueFalse = tokenValidationService.validateIdTokenIatMaxOffset(decodedIdToken, 5, false);
//       expect(valueFalse).toEqual(false);
//     });
//   });

//   describe('validateSignatureIdToken', () => {
//     it('returns false if null as both parameters is passed', () => {
//       const valueFalse = tokenValidationService.validateSignatureIdToken(null, null);
//       expect(valueFalse).toEqual(false);
//     });

//     it('returns false if jwtkeys has no keys-property', () => {
//       const valueFalse = tokenValidationService.validateSignatureIdToken(null, { notKeys: '' });
//       expect(valueFalse).toEqual(false);
//     });

//     it('returns false if header data has no header data', () => {
//       spyOn(tokenHelperService, 'getHeaderFromToken').and.returnValue({});

//       const jwtKeys = {
//         keys: 'someThing',
//       };

//       const valueFalse = tokenValidationService.validateSignatureIdToken(null, jwtKeys);
//       expect(valueFalse).toEqual(false);
//     });

//     it('returns false if header data alg property does not exist in keyalgorithms', () => {
//       spyOn(tokenHelperService, 'getHeaderFromToken').and.returnValue({ alg: 'NOT SUPPORTED ALG' });

//       const jwtKeys = {
//         keys: 'someThing',
//       };

//       const valueFalse = tokenValidationService.validateSignatureIdToken(null, jwtKeys);
//       expect(valueFalse).toEqual(false);
//     });

//     it('returns false if header data has kid property and kwtKeys has same kid property but they are not valid with the token', () => {
//       const kid = '5626CE6A8F4F5FCD79C6642345282CA76D337548';

//       spyOn(tokenHelperService, 'getHeaderFromToken').and.returnValue({ alg: 'RS256', kid });

//       const jwtKeys = {
//         keys: [
//           {
//             kty: 'RSA',
//             use: 'sig',
//             kid,
//             x5t: 'VibOao9PX815xmQjRSgsp20zdUg',
//             e: 'AQAB',
//             n:
//               'uu3-HK4pLRHJHoEBzFhM516RWx6nybG5yQjH4NbKjfGQ8dtKy1BcGjqfMaEKF8KOK44NbAx7rtBKCO9EKNYkeFvcUzBzVeuu4jWG61XYdTekgv-Dh_Fj8245GocEkbvBbFW6cw-_N59JWqUuiCvb-EOfhcuubUcr44a0AQyNccYNpcXGRcMKy7_L1YhO0AMULqLDDVLFj5glh4TcJ2N5VnJedq1-_JKOxPqD1ni26UOQoWrW16G29KZ1_4Xxf2jX8TAq-4RJEHccdzgZVIO4F5B4MucMZGq8_jMCpiTUsUGDOAMA_AmjxIRHOtO5n6Pt0wofrKoAVhGh2sCTtaQf2Q',
//             x5c: [
//               'MIIDPzCCAiegAwIBAgIQF+HRVxLHII9IlOoQk6BxcjANBgkqhkiG9w0BAQsFADAbMRkwFwYDVQQDDBBzdHMuZGV2LmNlcnQuY29tMB4XDTE5MDIyMDEwMTA0M1oXDTM5MDIyMDEwMTkyOVowGzEZMBcGA1UEAwwQc3RzLmRldi5jZXJ0LmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALrt/hyuKS0RyR6BAcxYTOdekVsep8mxuckIx+DWyo3xkPHbSstQXBo6nzGhChfCjiuODWwMe67QSgjvRCjWJHhb3FMwc1XrruI1hutV2HU3pIL/g4fxY/NuORqHBJG7wWxVunMPvzefSVqlLogr2/hDn4XLrm1HK+OGtAEMjXHGDaXFxkXDCsu/y9WITtADFC6iww1SxY+YJYeE3CdjeVZyXnatfvySjsT6g9Z4tulDkKFq1tehtvSmdf+F8X9o1/EwKvuESRB3HHc4GVSDuBeQeDLnDGRqvP4zAqYk1LFBgzgDAPwJo8SERzrTuZ+j7dMKH6yqAFYRodrAk7WkH9kCAwEAAaN/MH0wDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAtBgNVHREEJjAkghBzdHMuZGV2LmNlcnQuY29tghBzdHMuZGV2LmNlcnQuY29tMB0GA1UdDgQWBBQuyHxWP3je6jGMOmOiY+hz47r36jANBgkqhkiG9w0BAQsFAAOCAQEAKEHG7Ga6nb2XiHXDc69KsIJwbO80+LE8HVJojvITILz3juN6/FmK0HmogjU6cYST7m1MyxsVhQQNwJASZ6haBNuBbNzBXfyyfb4kr62t1oDLNwhctHaHaM4sJSf/xIw+YO+Qf7BtfRAVsbM05+QXIi2LycGrzELiXu7KFM0E1+T8UOZ2Qyv7OlCb/pWkYuDgE4w97ox0MhDpvgluxZLpRanOLUCVGrfFaij7gRAhjYPUY3vAEcD8JcFBz1XijU8ozRO6FaG4qg8/JCe+VgoWsMDj3sKB9g0ob6KCyG9L2bdk99PGgvXDQvMYCpkpZzG3XsxOINPd5p0gc209ZOoxTg==',
//             ],
//             alg: 'RS256',
//           },
//         ],
//       };

//       const valueFalse = tokenValidationService.validateSignatureIdToken('someNOTMATCHINGIdToken', jwtKeys);
//       expect(valueFalse).toEqual(false);
//     });

//     it('returns true if header data has kid property and kwtKeys has same kid property and they match with the token', () => {
//       const kid = '5626CE6A8F4F5FCD79C6642345282CA76D337548';
//       const idTokenGood =
//         'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU2MjZDRTZBOEY0RjVGQ0Q3OUM2NjQyMzQ1MjgyQ0E3NkQzMzc1NDgiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJWaWJPYW85UFg4MTV4bVFqUlNnc3AyMHpkVWcifQ.eyJuYmYiOjE1ODk1NTYxODYsImV4cCI6MTU4OTU1NjIxNiwiaXNzIjoiaHR0cHM6Ly9vZmZlcmluZ3NvbHV0aW9ucy1zdHMuYXp1cmV3ZWJzaXRlcy5uZXQiLCJhdWQiOiJhbmd1bGFyQ2xpZW50Iiwibm9uY2UiOiI3YmJjMWUzNDdhNjEzNzM2MmJhMGNmZGE4ZDMxZjllNjQ1UGhVZ0VIRCIsImlhdCI6MTU4OTU1NjE4NiwiYXRfaGFzaCI6IjNnbUdCTlhZVDFnS2liYXNIOFpVVHciLCJzX2hhc2giOiJ4VUZyY2o0a1hieU5MS3VNRFJKYlJBIiwic2lkIjoiaWRpeEtiQ28ySnBJY05RMlNWX0M3QSIsInN1YiI6IjMzNGM2MGM4LWZjNWQtNDI4Yy04NmFhLWJhZmMxYjQ0MWZiNCIsImF1dGhfdGltZSI6MTU4OTU0OTMzNywiaWRwIjoibG9jYWwiLCJhbXIiOlsicHdkIl19.Oj2zm5HsR9VKBnjGMUR08SWv8ZEx5tRivfAv5seEmkWMBkCcmveTsoGKa5CnDOw-bMz08qBGRtojAHSkwsWMI6QycrHr_sAApBu7ZJqEIwRgr4rKhbZKQTkjIH5kWZMG6N27t2CWD49hHvPStC30hN9SgnUYFRaAynYJSTCKsOhicD71ICEp8dYolj1tt6U7YX8ul24NQI1mKFpfIvVDkhhE1IGZolwiYFtKxhoEM-Q_KFj0OIx-Tg6eVnwKUEzCupShmgCaMNsv2H-wXgUBF9BYzFnQTcyb7WGcW9261pGDN4dgLDUaDwEY8abpXGTlg3AbnZcxeLl6jo1IGVP5aA';

//       spyOn(tokenHelperService, 'getHeaderFromToken').and.returnValue({ alg: 'RS256', kid });

//       const jwtKeys = {
//         keys: [
//           {
//             kty: 'RSA',
//             use: 'sig',
//             kid,
//             x5t: 'VibOao9PX815xmQjRSgsp20zdUg',
//             e: 'AQAB',
//             n:
//               'uu3-HK4pLRHJHoEBzFhM516RWx6nybG5yQjH4NbKjfGQ8dtKy1BcGjqfMaEKF8KOK44NbAx7rtBKCO9EKNYkeFvcUzBzVeuu4jWG61XYdTekgv-Dh_Fj8245GocEkbvBbFW6cw-_N59JWqUuiCvb-EOfhcuubUcr44a0AQyNccYNpcXGRcMKy7_L1YhO0AMULqLDDVLFj5glh4TcJ2N5VnJedq1-_JKOxPqD1ni26UOQoWrW16G29KZ1_4Xxf2jX8TAq-4RJEHccdzgZVIO4F5B4MucMZGq8_jMCpiTUsUGDOAMA_AmjxIRHOtO5n6Pt0wofrKoAVhGh2sCTtaQf2Q',
//             x5c: [
//               'MIIDPzCCAiegAwIBAgIQF+HRVxLHII9IlOoQk6BxcjANBgkqhkiG9w0BAQsFADAbMRkwFwYDVQQDDBBzdHMuZGV2LmNlcnQuY29tMB4XDTE5MDIyMDEwMTA0M1oXDTM5MDIyMDEwMTkyOVowGzEZMBcGA1UEAwwQc3RzLmRldi5jZXJ0LmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALrt/hyuKS0RyR6BAcxYTOdekVsep8mxuckIx+DWyo3xkPHbSstQXBo6nzGhChfCjiuODWwMe67QSgjvRCjWJHhb3FMwc1XrruI1hutV2HU3pIL/g4fxY/NuORqHBJG7wWxVunMPvzefSVqlLogr2/hDn4XLrm1HK+OGtAEMjXHGDaXFxkXDCsu/y9WITtADFC6iww1SxY+YJYeE3CdjeVZyXnatfvySjsT6g9Z4tulDkKFq1tehtvSmdf+F8X9o1/EwKvuESRB3HHc4GVSDuBeQeDLnDGRqvP4zAqYk1LFBgzgDAPwJo8SERzrTuZ+j7dMKH6yqAFYRodrAk7WkH9kCAwEAAaN/MH0wDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAtBgNVHREEJjAkghBzdHMuZGV2LmNlcnQuY29tghBzdHMuZGV2LmNlcnQuY29tMB0GA1UdDgQWBBQuyHxWP3je6jGMOmOiY+hz47r36jANBgkqhkiG9w0BAQsFAAOCAQEAKEHG7Ga6nb2XiHXDc69KsIJwbO80+LE8HVJojvITILz3juN6/FmK0HmogjU6cYST7m1MyxsVhQQNwJASZ6haBNuBbNzBXfyyfb4kr62t1oDLNwhctHaHaM4sJSf/xIw+YO+Qf7BtfRAVsbM05+QXIi2LycGrzELiXu7KFM0E1+T8UOZ2Qyv7OlCb/pWkYuDgE4w97ox0MhDpvgluxZLpRanOLUCVGrfFaij7gRAhjYPUY3vAEcD8JcFBz1XijU8ozRO6FaG4qg8/JCe+VgoWsMDj3sKB9g0ob6KCyG9L2bdk99PGgvXDQvMYCpkpZzG3XsxOINPd5p0gc209ZOoxTg==',
//             ],
//             alg: 'RS256',
//           },
//         ],
//       };

//       const valueFalse = tokenValidationService.validateSignatureIdToken(idTokenGood, jwtKeys);
//       expect(valueFalse).toEqual(true);
//     });
//   });

//   describe('validateIdTokenAtHash', () => {
//     it('returns true if sha is sha256 and generated hash equals atHash param', () => {
//       const accessToken = 'iGU3DhbPoDljiYtr0oepxi7zpT8BsjdU7aaXcdq-DPk';
//       const atHash = '-ODC_7Go_UIUTC8nP4k2cA';

//       const result = tokenValidationService.validateIdTokenAtHash(accessToken, atHash, '256');
//       expect(result).toEqual(true);
//     });

//     it('returns false if sha is sha256 and generated hash does not equal atHash param', () => {
//       const accessToken =
//         'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
//       const atHash = 'bad';

//       const result = tokenValidationService.validateIdTokenAtHash(accessToken, atHash, '256');
//       expect(result).toEqual(false);
//     });

//     it('returns true if sha is sha256 and generated hash does equal atHash param', () => {
//       const accessToken =
//         'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
//       const atHash = 'good';

//       spyOn(tokenValidationService as any, 'generateAtHash').and.returnValues('notEqualsGood', 'good');

//       const result = tokenValidationService.validateIdTokenAtHash(accessToken, atHash, '256');
//       expect(result).toEqual(true);
//     });

//     it('returns false if sha is sha384 and generated hash does not equal atHash param', () => {
//       const accessToken =
//         'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
//       const atHash = 'bad';

//       const result = tokenValidationService.validateIdTokenAtHash(accessToken, atHash, '384');
//       expect(result).toEqual(false);
//     });

//     it('returns false if sha is sha512 and generated hash does not equal atHash param', () => {
//       const accessToken =
//         'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';
//       const atHash = 'bad';

//       const result = tokenValidationService.validateIdTokenAtHash(accessToken, atHash, '512');
//       expect(result).toEqual(false);
//     });
//   });

//   describe('validateStateFromHashCallback', () => {
//     it('returns true when state and localstate match', () => {
//       const result = tokenValidationService.validateStateFromHashCallback('sssd', 'sssd');
//       expect(result).toEqual(true);
//     });

//     it('returns false when state and local state do not match', () => {
//       const result = tokenValidationService.validateStateFromHashCallback('sssd', 'bad');
//       expect(result).toEqual(false);
//     });
//   });

//   describe('generateCodeChallenge', () => {
//     it('returns good result with correct codeVerifier', () => {
//       const result = tokenValidationService.generateCodeChallenge('44445543344242132145455aaabbdc3b4');
//       expect(result).toEqual('R2TWD45Vtcf_kfAqjuE3LMSRF3JDE5fsFndnn6-a0nQ');
//     });
//   });

//   describe('validateIdTokenExpNotExpired', () => {
//     it('returns false when tokenExpirationDate is falsy', () => {
//       spyOn(tokenHelperService, 'getTokenExpirationDate').and.returnValue(null);
//       const notExpired = tokenValidationService.validateIdTokenExpNotExpired('idToken', 0);
//       expect(notExpired).toEqual(false);
//     });

//     it('validateIdTokenExpNotExpired', () => {
//       const idToken =
//         'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';

//       const notExpired = tokenValidationService.validateIdTokenExpNotExpired(idToken, 0);
//       expect(notExpired).toEqual(false);
//     });
//   });

//   describe('validateAccessTokenNotExpired', () => {
//     const testCases = [
//       {
//         // Mon Jan 19 1970 10:26:50 GMT+0100,
//         date: new Date(1589210086),
//         offsetSeconds: 0,
//         expectedResult: false,
//       },
//       {
//         // Sun Nov 01 2550 00:00:00 GMT+0100
//         date: new Date(2550, 10),
//         offsetSeconds: 0,
//         expectedResult: true,
//       },
//       {
//         date: null,
//         offsetSeconds: 300,
//         expectedResult: true,
//       },
//     ];

//     testCases.forEach(({ date, offsetSeconds, expectedResult }) => {
//       it(`returns ${expectedResult} if ${date} is given with an offset of ${offsetSeconds}`, () => {
//         const notExpired = tokenValidationService.validateAccessTokenNotExpired(date, offsetSeconds);

//         expect(notExpired).toEqual(expectedResult);
//       });
//     });
//   });

//   describe('hasIdTokenExpired', () => {
//     it('returns true if token has expired', () => {
//       const idToken =
//         'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';

//       const result = tokenValidationService.hasIdTokenExpired(idToken);

//       expect(result).toBe(true);
//     });

//     it('returns false if token has not expired using offset', () => {
//       // expires 2050-02-12T08:02:30.823Z
//       const tokenExpires = new Date('2050-02-12T08:02:30.823Z');
//       const idToken =
//         'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2MTMxMTY5NTAsImV4cCI6MjUyODI2NTc1MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.GHxRo23NghUTTeZx6VIzTSf05JEeEn7z9YYyFLxWv6M';

//       spyOn(tokenHelperService, 'getTokenExpirationDate').and.returnValue(tokenExpires);

//       const result = tokenValidationService.hasIdTokenExpired(idToken);

//       expect(result).toBe(false);
//     });
//   });
// });

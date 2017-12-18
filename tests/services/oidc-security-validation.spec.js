"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("@angular/common/http");
var testing_1 = require("@angular/core/testing");
var platform_browser_1 = require("@angular/platform-browser");
var testing_2 = require("@angular/router/testing");
var angular_auth_oidc_client_1 = require("../../src/angular-auth-oidc-client");
var auth_configuration_1 = require("../../src/modules/auth.configuration");
var oidc_security_common_1 = require("../../src/services/oidc.security.common");
var oidc_security_validation_1 = require("../../src/services/oidc.security.validation");
var test_storage_service_1 = require("../common/test-storage.service");
var index_1 = require("./../../index");
var oidc_array_helper_service_1 = require("../../src/services/oidc-array-helper.service");
var oidc_token_helper_service_1 = require("../../src/services/oidc-token-helper.service");
describe('OidcSecurityValidation', function () {
    beforeEach(function () {
        testing_1.TestBed.configureTestingModule({
            imports: [
                platform_browser_1.BrowserModule,
                http_1.HttpClientModule,
                testing_2.RouterTestingModule,
                index_1.AuthModule.forRoot()
            ],
            providers: [oidc_array_helper_service_1.ArrayHelperService]
        });
    });
    // beforeEach(() => {
    //     oidcSecurityService = TestBed.get(OidcSecurityService);
    // });
    it('validate aud string', function () {
        var authConfiguration = new auth_configuration_1.AuthConfiguration(new auth_configuration_1.DefaultConfiguration());
        var openIDImplicitFlowConfiguration = new angular_auth_oidc_client_1.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url =
            'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id =
            '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri =
            'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url =
            'https://localhost:44386/wellknownconfiguration.json';
        authConfiguration.init(openIDImplicitFlowConfiguration);
        var oidcSecurityStorage = new test_storage_service_1.TestStorage();
        var oidcSecurityCommon = new oidc_security_common_1.OidcSecurityCommon(authConfiguration, oidcSecurityStorage);
        var oidcSecurityValidation = new oidc_security_validation_1.OidcSecurityValidation(oidcSecurityCommon, new oidc_array_helper_service_1.ArrayHelperService(), new oidc_token_helper_service_1.TokenHelperService());
        var dataIdToken = { aud: 'banana' };
        var valueTrue = oidcSecurityValidation.validate_id_token_aud(dataIdToken, 'banana');
        expect(valueTrue).toEqual(true);
        var valueFalse = oidcSecurityValidation.validate_id_token_aud(dataIdToken, 'bananammmm');
        expect(valueFalse).toEqual(false);
    });
    it('validate aud array', function () {
        var authConfiguration = new auth_configuration_1.AuthConfiguration(new auth_configuration_1.DefaultConfiguration());
        var openIDImplicitFlowConfiguration = new angular_auth_oidc_client_1.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url =
            'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id =
            '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri =
            'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url =
            'https://localhost:44386/wellknownconfiguration.json';
        authConfiguration.init(openIDImplicitFlowConfiguration);
        var oidcSecurityStorage = new test_storage_service_1.TestStorage();
        var oidcSecurityCommon = new oidc_security_common_1.OidcSecurityCommon(authConfiguration, oidcSecurityStorage);
        var oidcSecurityValidation = new oidc_security_validation_1.OidcSecurityValidation(oidcSecurityCommon, new oidc_array_helper_service_1.ArrayHelperService(), new oidc_token_helper_service_1.TokenHelperService());
        var dataIdToken = {
            aud: ['banana', 'apple', 'https://nice.dom']
        };
        var valueTrue = oidcSecurityValidation.validate_id_token_aud(dataIdToken, ['banana', 'apple', 'https://nice.dom']);
        expect(valueTrue).toEqual(true);
        var valueFalse = oidcSecurityValidation.validate_id_token_aud(dataIdToken, ['ooo', 'apple', 'https://nice.dom']);
        expect(valueFalse).toEqual(false);
    });
});
//# sourceMappingURL=oidc-security-validation.spec.js.map
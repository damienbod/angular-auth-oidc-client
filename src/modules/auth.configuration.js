var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@angular/core';
var AuthConfiguration = (function () {
    function AuthConfiguration() {
        this.stsServer = 'https://localhost:44318';
        this.redirect_url = 'https://localhost:44311';
        this.client_id = 'angularclient';
        this.response_type = 'id_token token';
        this.scope = 'dataEventRecords securedFiles openid';
        this.post_logout_redirect_uri = 'https://localhost:44311/Unauthorized';
        this.start_checksession = false;
        this.silent_renew = true;
        this.startup_route = '/dataeventrecords/list';
        this.forbidden_route = '/Forbidden';
        this.unauthorized_route = '/Unauthorized';
        this.log_console_warning_active = true;
        this.log_console_debug_active = true;
        this.max_id_token_iat_offset_allowed_in_seconds = 3;
    }
    return AuthConfiguration;
}());
AuthConfiguration = __decorate([
    Injectable()
], AuthConfiguration);
export { AuthConfiguration };
//# sourceMappingURL=auth.configuration.js.map
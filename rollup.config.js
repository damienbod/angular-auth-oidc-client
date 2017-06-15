import resolve from 'rollup-plugin-node-resolve';

const globals = {
    '@angular/core': 'ng.core',
    '@angular/http': 'ng.http',
    '@angular/router': 'ng.router',
    'rxjs/Rx': 'Rx',
    'rxjs/Observable': 'Rx',
    'rxjs/Observer': 'Rx',
    'rxjs/BehaviorSubject': 'Rx',
    'rxjs/add/operator/map': 'Rx',
    'rxjs/add/operator/catch': 'Rx',
    'rxjs/add/observable/throw': 'Rx',
    'rxjs/add/observable/interval': 'Rx',
    'rxjs/add/observable/timer': 'Rx'
};

export default {
    entry: './dist/modules/angular-auth-oidc-client.es5.js',
    dest: './dist/bundles/angular-auth-oidc-client.umd.js',
    format: 'umd',
    exports: 'named',
    moduleName: 'ng.angularAuthOidcClient',
    plugins: [resolve()],
    external: Object.keys(globals),
    globals: globals,
    onwarn: () => { return }
}
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

const globals = {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    '@angular/router': 'ng.router',
	'@angular/common/http': 'ng.http',
    'rxjs/Rx': 'Rx',
    'rxjs/Observable': 'Rx',
    'rxjs/Observer': 'Rx',
    'rxjs/BehaviorSubject': 'Rx',
    'rxjs/add/operator/map': 'Rx.Observable.prototype',
    'rxjs/add/operator/catch': 'Rx.Observable.prototype',
    'rxjs/add/operator/timeInterval': 'Rx.Observable.prototype',
    'rxjs/add/operator/pluck': 'Rx.Observable.prototype',
    'rxjs/add/operator/take': 'Rx.Observable.prototype',
    'rxjs/add/observable/empty': 'Rx.Observable',
    'rxjs/add/observable/throw': 'Rx.Observable',
    'rxjs/add/observable/interval': 'Rx.Observable',
    'rxjs/add/observable/timer': 'Rx.Observable',
    'jsrsasign': 'jsrsasign'
};

export default {
    entry: './dist/modules/angular-auth-oidc-client.es5.js',
    dest: './dist/bundles/angular-auth-oidc-client.umd.js',
    format: 'umd',
    exports: 'named',
    moduleName: 'ng.angularAuthOidcClient',
    plugins: [
        resolve(),
        commonjs({
            namedExports: {
                'node_modules/jsrsasign\lib\jsrsasign.js': ['KJUR', 'KEYUTIL', 'hextob64u']
            }
        })
    ],
    external: Object.keys(globals),
    globals: globals,
    onwarn: () => { return }
}
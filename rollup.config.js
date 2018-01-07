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
    'rxjs/operators': 'Rx.Observable.prototype',
	'rxjs/observable/timer': 'Rx.Observable.prototype',

    jsrsasign: 'jsrsasign'
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
    onwarn: () => {
        return;
    }
};

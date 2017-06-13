import resolve from 'rollup-plugin-node-resolve';

// Add here external dependencies that actually you use.
const globals = {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    '@angular/forms': 'ng.forms',
    '@angular/http': 'ng.http',
	'@angular/router': 'ng.router',
    'rxjs/Observable': 'Rx',
    'rxjs/Observer': 'Rx'
};

export default {
    entry: './dist/modules/angular-auth-oidc-client.es5.js',
    dest: './dist/bundles/angular-auth-oidc-client.umd.js',
    format: 'umd',
    exports: 'named',
    moduleName: 'angular-auth-oidc-client',
    plugins: [resolve()],
    external: Object.keys(globals),
    globals: globals,
    onwarn: () => { return }
}
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

const globals = {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    '@angular/router': 'ng.router',
    '@angular/common/http': 'ng.common.http',
    rxjs: 'rxjs',
    'rxjs/operators': 'rxjs.operators',
    jsrsasign: 'jsrsasign',
    buffer: 'buffer',
};

export default {
    external: Object.keys(globals),
    plugins: [resolve(), sourcemaps()],
    onwarn: () => {
        return;
    },
    output: {
        format: 'umd',
        name: 'ng.angularAuthOidcClient',
        globals: globals,
        sourcemap: true,
        exports: 'named',
        amd: { id: 'angular-library-starter' },
    },
    plugins: [
        resolve(),
        commonjs({
            namedExports: {
                'node_modules/jsrsasign/lib/jsrsasign.js': ['KJUR', 'KEYUTIL', 'hextob64u'],
            },
        }),
    ],
};

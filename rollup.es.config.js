import sourcemaps from 'rollup-plugin-sourcemaps';
import license from 'rollup-plugin-license';

const path = require('path');

export default {
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: [
        sourcemaps(),
        license({
            sourceMap: true,
            banner: {
                file: path.join(__dirname, 'license-banner.txt'),
                encoding: 'utf-8',
            },
        }),
    ],
    onwarn: () => {
        return;
    },
};

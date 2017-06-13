# angular-library-starter
[![Build Status](https://travis-ci.org/damienbod/angular-auth-oidc-client.svg?branch=master)](https://travis-ci.org/damienbod/angular-auth-oidc-client)
>OpenID Connect Implicit Flow


Get the [Changelog](https://github.com/damienbod/angular-auth-oidc-client/blob/master/CHANGELOG.md).

## Contents
* [1 Project structure](#1)
* [2 Customizing](#2)
* [3 Testing](#3)
* [4 Building](#4)
* [5 Publishing](#5)
* [6 Documentation](#6)
* [7 Using the library](#7)
* [8 What it is important to know](#8)

## <a name="1"></a>1 Project structure
- Library:
    - **src** folder for the classes
    - **public_api.ts** entry point for all public APIs of the package
    - **package.json** _npm_ options
    - **rollup.config.js** _Rollup_ configuration for building the bundles
    - **tsconfig-build.json** _ngc_ compiler options for _AoT compilation_
    - **build.js** building process using _ShellJS_
- Testing:
    - **tests** folder for unit & integration tests
    - **karma.conf.js** _Karma_ configuration that uses _webpack_ to build the tests
    - **spec.bundle.js** defines the files used by _webpack_
- Extra:
    - **tslint.json** _TypeScript_ linter rules with _Codelyzer_
    - **travis.yml** _Travis CI_ configuration


## <a name="3"></a>3 Testing
The following command run unit & integration tests that are in the `tests` folder, and unit tests that are in `src` folder: 
```Shell
npm test 
```

## <a name="4"></a>4 Building
The following command:
```Shell
npm run build
```
- starts _TSLint_ with _Codelyzer_
- starts _AoT compilation_ using _ngc_ compiler
- creates `dist` folder with all the files of distribution

> If you get errors during the building process or bundles are not created, set _silent_ to false in the _build.js_ file to check what's going wrong: warnings on the first execution of _rollup_ are normal, and also the errors on _tsc_ are a known issue.

To test locally the npm package:
```Shell
npm run pack-lib
```
Then you can install it in an app to test it:
```Shell
npm install [path]my-library-[version].tgz
```

## <a name="5"></a>5 Publishing
Before publishing the first time:
- you can register your library on [Travis CI](https://travis-ci.org/): you have already configured `.travis.yml` file
- you must have a user on the _npm_ registry: [Publishing npm packages](https://docs.npmjs.com/getting-started/publishing-npm-packages)

```Shell
npm run publish-lib
```

## <a name="6"></a>6 Documentation
To generate the documentation, this starter uses [compodoc](https://github.com/compodoc/compodoc):
```Shell
npm run compodoc
npm run compodoc-serve 
```

## <a name="7"></a>7 Using the library
### Installing
```Shell
npm install my-library --save 
```
### Loading
#### Using SystemJS configuration
```JavaScript
System.config({
    map: {
        'angular-auth-oidc-client': 'node_modules/angular-auth-oidc-client/bundles/my-library.umd.js'
    }
});
```
#### Angular-CLI
No need to set up anything, just import it in your code.
#### Rollup or webpack
No need to set up anything, just import it in your code.
#### Plain JavaScript
Include the `umd` bundle in your `index.html`:
```Html
<script src="node_modules/angular-auth-oidc-client/bundles/angular-auth-oidc-client.umd.js"></script>
```
and use global `ng.myLibrary` namespace.

### AoT compilation
The library is compatible with _AoT compilation_.

## <a name="8"></a>8 What it is important to know
1. `package.json`

    * `"main": "./bundles/angular-auth-oidc-client.umd.js"` legacy module format 
    * `"module": "./bundles/angular-auth-oidc-client.es5.js"` flat _ES_ module, for using module bundlers such as _Rollup_ or _webpack_: 
    [package module](https://github.com/rollup/rollup/wiki/pkg.module)
    * `"es2015": "./bundles/angular-auth-oidc-client.js"` _ES2015_ flat _ESM_ format, experimental _ES2015_ build
    * `"peerDependencies"` the packages and their versions required by the library when it will be installed

2. `tsconfig.json` file used by _TypeScript_ compiler

    * Compiler options:
        * `"strict": true` enables _TypeScript_ `strict` master option

3. `tsconfig-build.json` file used by _ngc_ compiler

    * Compiler options:
        * `"declaration": true` to emit _TypeScript_ declaration files
        * `"module": "es2015"` & `"target": "es2015"` are used by _Rollup_ to create the _ES2015_ bundle

    * Angular Compiler Options:
        * `"skipTemplateCodegen": true,` skips generating _AoT_ files
        * `"annotateForClosureCompiler": true` for compatibility with _Google Closure compiler_
        * `"strictMetadataEmit": true` without emitting metadata files, the library will not compatible with _AoT compilation_

4. `rollup.config.js` file used by _Rollup_

    * `format: 'umd'` the _Universal Module Definition_ pattern is used by _Angular_ for its bundles
    * `moduleName: 'ng.angularLibraryStarter'` defines the global namespace used by _JavaScript_ apps
    * `external` & `globals` declare the external packages

5. Server-side prerendering

    If you want the library will be compatible with server-side prerendering:
    * `window`, `document`, `navigator` and other browser types do not exist on the server
    * don't manipulate the _nativeElement_ directly

## License
MIT

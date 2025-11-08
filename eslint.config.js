const security = require('eslint-plugin-security');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
      '*.config.js',
      'demo/**'  // Demo files intentionally have insecure code
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        global: 'readonly',

        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',

        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    plugins: {
      security
    },
    rules: {
      // Variables
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'warn',

      // Security - Dangerous Functions
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Security Plugin Rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // Console
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Best Practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-throw-literal': 'error',
      'no-return-await': 'warn',
      'require-await': 'warn',
      'no-async-promise-executor': 'error',

      // Strict Mode
      'strict': ['error', 'global'],
      'no-multi-str': 'error',
      'no-proto': 'error',
      'no-void': 'error',
      'no-with': 'error',

      // Functions
      'array-callback-return': 'error',
      'consistent-return': 'warn',
      'default-case': 'warn',
      'no-alert': 'warn',
      'no-caller': 'error',
      'no-else-return': 'warn',
      'no-empty-function': 'warn',
      'no-extend-native': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-param-reassign': 'warn',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'warn',
      'radix': 'error'
    }
  },
  // Configuración especial para archivos de test
  {
    files: ['test/**/*.js', '**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-script-url': 'off',  // Tests verifican URLs maliciosas
      'no-console': 'off'      // Tests pueden usar console.log
    }
  }
];

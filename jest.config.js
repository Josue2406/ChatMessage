module.exports = {
  // Entorno de ejecución
  testEnvironment: 'node',

  // Archivos de test
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],

  // Cobertura de código
  collectCoverage: false, // Se activa manualmente con --coverage
  collectCoverageFrom: [
    'libs/**/*.js',
    'server.js',
    '!node_modules/**',
    '!test/**',
    '!demo/**',
    '!coverage/**'
  ],

  // Umbrales de cobertura (BDD best practices)
  coverageThreshold: {
    global: {
      branches: 23,
      functions: 23,
      lines: 23,
      statements: 23
    }
  },

  // Reportes de cobertura
  coverageReporters: [
    'text',           // Muestra en consola
    'text-summary',   // Resumen en consola
    'html',           // Reporte HTML navegable
    'lcov',           // Para integración con herramientas CI/CD
    'json',           // Para procesamiento programático
    'cobertura'       // XML para SonarQube/Jenkins
  ],

  // Directorio de salida para reportes
  coverageDirectory: 'coverage',

  // Timeout para tests
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Limpia mocks automáticamente entre tests
  clearMocks: true,

  // Notificaciones
  notify: false,

  // Configuración de reporters
  reporters: ['default'],

  // Configuración de transformación (si usas Babel)
  transform: {},

  // Archivos de setup si necesitas configuración global
  // setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Ignorar node_modules
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],

  // Mock para archivos estáticos si fuera necesario
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};

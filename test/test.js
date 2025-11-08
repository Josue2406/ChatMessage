const val = require('../libs/unalib');
const assert = require('assert');


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });

  describe('Sanitización de Entrada', () => {

    test('debería sanitizar entrada con caracteres especiales', () => {
      const input = '<script>alert("XSS")</script>Usuario';
      const sanitized = unalib.sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('Usuario');
    });

    test('debería manejar entrada vacía', () => {
      expect(unalib.sanitizeInput('')).toBe('Anónimo');
    });

    test('debería manejar entrada null', () => {
      expect(unalib.sanitizeInput(null)).toBe('Anónimo');
    });

    test('debería limitar longitud a 50 caracteres', () => {
      const longInput = 'A'.repeat(100);
      const sanitized = unalib.sanitizeInput(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(50);
    });

  });

  describe('Validación de Colores', () => {

    test('debería validar color hexadecimal válido', () => {
      expect(unalib.validateColor('#FF0000')).toBe('#FF0000');
    });

    test('debería retornar negro para color inválido', () => {
      expect(unalib.validateColor('rojo')).toBe('#000000');
    });

    test('debería retornar negro para entrada maliciosa', () => {
      expect(unalib.validateColor('javascript:alert(1)')).toBe('#000000');
    });

  });

  describe('Detección de Inyección de Scripts', () => {

    test('debería detectar tag script', () => {
      expect(unalib.isScriptInjection('<script>alert(1)</script>')).toBe(true);
    });

    test('debería detectar javascript: URL', () => {
      expect(unalib.isScriptInjection('javascript:void(0)')).toBe(true);
    });

    test('debería detectar event handlers', () => {
      expect(unalib.isScriptInjection('<img onerror="alert(1)">')).toBe(true);
    });

    test('debería detectar iframe', () => {
      expect(unalib.isScriptInjection('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    test('NO debería detectar texto normal como inyección', () => {
      expect(unalib.isScriptInjection('Hola mundo')).toBe(false);
    });

  });

});








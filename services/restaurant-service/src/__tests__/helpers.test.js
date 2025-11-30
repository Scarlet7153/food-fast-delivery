const { removeVietnameseAccents } = require('../utils/helpers');

describe('Helper Functions - Unit Tests', () => {
  describe('removeVietnameseAccents', () => {
    it('TC_HELPER_001: Should remove accents from Vietnamese text', () => {
      expect(removeVietnameseAccents('Bánh Mỳ')).toBe('Banh My');
    });

    it('TC_HELPER_002: Should handle empty string', () => {
      expect(removeVietnameseAccents('')).toBe('');
    });

    it('TC_HELPER_003: Should handle null', () => {
      expect(removeVietnameseAccents(null)).toBe('');
    });

    it('TC_HELPER_004: Should handle undefined', () => {
      expect(removeVietnameseAccents(undefined)).toBe('');
    });

    it('TC_HELPER_005: Should handle mixed case', () => {
      expect(removeVietnameseAccents('BÁNH MỲ')).toBe('BANH MY');
    });

    it('TC_HELPER_006: Should remove all Vietnamese accents', () => {
      const text = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
      const expected = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiioooooooooooooouuuuuuuuuuyyyyyyd';
      expect(removeVietnameseAccents(text)).toBe(expected);
    });

    it('TC_HELPER_007: Should handle uppercase Vietnamese accents', () => {
      const text = 'ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ';
      const expected = 'AAAAAAAAAAAAAAAAAEEEEEEEEEEIIIIIOOOOOOOOOOOOOOUUUUUUUUUUYYYYYD';
      expect(removeVietnameseAccents(text)).toBe(expected);
    });

    it('TC_HELPER_008: Should preserve non-Vietnamese characters', () => {
      expect(removeVietnameseAccents('Hello World 123')).toBe('Hello World 123');
    });

    it('TC_HELPER_009: Should handle mixed Vietnamese and English', () => {
      expect(removeVietnameseAccents('Bánh Mỳ Sandwich')).toBe('Banh My Sandwich');
    });

    it('TC_HELPER_010: Should handle special characters', () => {
      expect(removeVietnameseAccents('Bánh Mỳ @#$%')).toBe('Banh My @#$%');
    });
  });
});


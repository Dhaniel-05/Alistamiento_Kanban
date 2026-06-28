const {
  PLANEACIONES_LIMIT,
  DEFAULT_LIMIT,
  isPlaneacionesApiPath,
} = require('../config/bodyLimits');

describe('bodyLimits', () => {
  describe('isPlaneacionesApiPath', () => {
    it('identifica rutas bajo /api/planeaciones', () => {
      expect(isPlaneacionesApiPath({ originalUrl: '/api/planeaciones' })).toBe(true);
      expect(isPlaneacionesApiPath({ originalUrl: '/api/planeaciones/ficha/1' })).toBe(true);
      expect(isPlaneacionesApiPath({ url: '/api/planeaciones?foo=1' })).toBe(true);
    });

    it('excluye otras rutas /api', () => {
      expect(isPlaneacionesApiPath({ originalUrl: '/api/auth/login' })).toBe(false);
      expect(isPlaneacionesApiPath({ originalUrl: '/api/fichas' })).toBe(false);
      expect(isPlaneacionesApiPath({ originalUrl: '/api/planeaciones-extra' })).toBe(false);
    });
  });

  it('exporta límites nombrados documentados', () => {
    expect(PLANEACIONES_LIMIT).toBe('20mb');
    expect(DEFAULT_LIMIT).toBe('1mb');
  });
});

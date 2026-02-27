// Necesario para tests que importan lib/config (p. ej. API login)
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-with-at-least-32-characters!!';

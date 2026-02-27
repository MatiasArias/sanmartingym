// Necesario para tests que importan lib/config (p. ej. API login)
// NODE_ENV es read-only en TypeScript; Vitest lo setea automáticamente a 'test'
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-with-at-least-32-characters!!';

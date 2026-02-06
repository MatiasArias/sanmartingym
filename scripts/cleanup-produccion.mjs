#!/usr/bin/env node
/**
 * Limpieza de producción: borra jugadores, progresos, rutinas y staff en Redis,
 * y deja solo los dos usuarios indicados:
 *
 *   - Matias Arias - 19/01/2001 - DNI 43132313 - Jugador categoría PERSONAL
 *   - Lucas Salvador - 21/03/2001 - DNI 43132344 - Staff
 *
 * Uso (producción): SANMARTIN_REDIS_URL="redis://..." node scripts/cleanup-produccion.mjs
 * Uso (local con .env.local): node scripts/cleanup-produccion.mjs
 */

import Redis from 'ioredis';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const redisUrl = process.env.SANMARTIN_REDIS_URL || process.env.REDIS_URL;
if (!redisUrl) {
  console.error('❌ SANMARTIN_REDIS_URL o REDIS_URL es requerido');
  process.exit(1);
}

const redis = new Redis(redisUrl);

function set(key, value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return redis.set(key, str);
}

const BATCH_SIZE = 500;

async function deleteByPattern(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const chunk = keys.slice(i, i + BATCH_SIZE);
    await redis.del(...chunk);
  }
  return keys.length;
}

async function run() {
  console.log('🧹 Limpieza de producción: jugadores, progresos, rutinas y staff\n');

  const patterns = [
    ['usuario:user-*', 'Usuarios (jugadores/staff)'],
    ['usuario:dni:*', 'Usuarios por DNI'],
    ['categoria:*', 'Categorías'],
    ['rutina:*', 'Rutinas'],
    ['rutinas:categoria:*', 'Listas rutinas por categoría'],
    ['ejercicio:*', 'Ejercicios de rutinas'],
    ['ejercicios:rutina:*', 'Listas ejercicios por rutina'],
    ['registros:jugador:*', 'Registros de carga (progreso)'],
    ['asistencia:*', 'Asistencias'],
    ['rpe_sesion:*', 'RPE de sesiones'],
    ['wellness:*', 'Sesiones wellness'],
    ['comentarios:ejercicio:*', 'Comentarios por ejercicio'],
    ['comentarios:indice', 'Índice comentarios'],
    ['comentarios:resueltos', 'Comentarios resueltos'],
    ['staff:ultima_vista_comentarios:*', 'Vista comentarios staff'],
  ];

  let totalDeleted = 0;
  for (const [pattern, label] of patterns) {
    const n = await deleteByPattern(pattern);
    if (n > 0) {
      console.log(`  ✓ ${label}: ${n} clave(s) eliminada(s)`);
      totalDeleted += n;
    }
  }

  console.log(totalDeleted > 0 ? `\n  Total: ${totalDeleted} claves eliminadas.\n` : '\n  No había datos que borrar.\n');

  // --- Seed: categoría PERSONAL y dos usuarios ---
  console.log('🌱 Creando datos de producción...\n');

  const catPersonal = { id: 'cat-personal', nombre: 'PERSONAL' };
  await set('categoria:cat-personal', catPersonal);
  console.log('  ✓ Categoría PERSONAL (cat-personal)');

  const matias = {
    id: 'user-jugador-matrias',
    dni: '43132313',
    nombre: 'Matias Arias',
    rol: 'jugador',
    categoria_id: 'cat-personal',
    fecha_nacimiento: '2001-01-19',
    activo: true,
  };
  await set(`usuario:${matias.id}`, matias);
  await set(`usuario:dni:${matias.dni}`, matias);
  console.log('  ✓ Matias Arias - Jugador - PERSONAL - 19/01/2001 - DNI 43132313');

  const lucas = {
    id: 'user-staff-lucas',
    dni: '43132344',
    nombre: 'Lucas Salvador',
    rol: 'staff',
    fecha_nacimiento: '2001-03-21',
    activo: true,
  };
  await set(`usuario:${lucas.id}`, lucas);
  await set(`usuario:dni:${lucas.dni}`, lucas);
  console.log('  ✓ Lucas Salvador - Staff - 21/03/2001 - DNI 43132344');

  await redis.quit();

  console.log('\n✅ Producción lista.');
  console.log('\n📝 Usuarios en producción:');
  console.log('   Jugador: DNI 43132313 (Matias Arias) — categoría PERSONAL');
  console.log('   Staff:   DNI 43132344 (Lucas Salvador)\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

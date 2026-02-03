#!/usr/bin/env node
/**
 * Elimina registros duplicados por día/ejercicio/serie.
 * Mantiene solo un registro por (ejercicio_id, fecha, serie_num) — el más reciente.
 *
 * Uso: node scripts/cleanup-registros-duplicados.mjs
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

function parse(val) {
  if (val == null) return null;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

async function cleanup() {
  console.log('🧹 Limpiando registros duplicados...\n');

  const keys = await redis.keys('registros:jugador:*');
  let totalEliminados = 0;

  for (const key of keys) {
    const raw = await redis.lrange(key, 0, -1);
    const registros = raw.map((r) => parse(r)).filter(Boolean);

    if (registros.length === 0) continue;

    // Agrupar por (ejercicio_id, fecha, serie_num), quedarse con el más reciente
    const mapa = new Map();
    for (const r of registros) {
      const k = `${r.ejercicio_id}|${r.fecha}|${r.serie_num}`;
      const existing = mapa.get(k);
      if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
        mapa.set(k, r);
      }
    }

    const unicos = Array.from(mapa.values());
    const eliminados = registros.length - unicos.length;

    if (eliminados > 0) {
      const jugadorId = key.replace('registros:jugador:', '');
      console.log(`  Jugador ${jugadorId}: ${registros.length} → ${unicos.length} (eliminados ${eliminados})`);
      totalEliminados += eliminados;

      await redis.del(key);
      if (unicos.length > 0) {
        const strValues = unicos.map((v) => JSON.stringify(v));
        await redis.lpush(key, ...strValues);
      }
    }
  }

  await redis.quit();

  if (totalEliminados > 0) {
    console.log(`\n✅ Listo. Se eliminaron ${totalEliminados} registros duplicados.`);
  } else {
    console.log('\n✅ No había duplicados para eliminar.');
  }

  process.exit(0);
}

cleanup().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

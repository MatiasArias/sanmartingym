#!/usr/bin/env node

import Redis from 'ioredis';
import { config } from 'dotenv';

// Cargar .env.local por defecto; en producción usar REDIS_URL del sistema
config({ path: '.env.local' });

const redisUrl = process.env.SANMARTIN_REDIS_URL || process.env.REDIS_URL;
const redis = new Redis(redisUrl);

function set(key, value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return redis.set(key, str);
}

function lpush(key, ...values) {
  const strValues = values.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
  return redis.lpush(key, ...strValues);
}

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Categorías
  console.log('📂 Creating categories...');
  const categorias = [
    { id: 'cat-m15', nombre: 'M15' },
    { id: 'cat-m17', nombre: 'M17' },
    { id: 'cat-primera', nombre: 'Primera' },
    { id: 'cat-femenino', nombre: 'Femenino' },
  ];

  for (const cat of categorias) {
    await set(`categoria:${cat.id}`, cat);
  }

  // 2. Staff
  console.log('👨‍🏫 Creating staff...');
  const staff = [
    {
      id: 'user-staff-1',
      dni: '20345678',
      nombre: 'Lucas Salvador',
      rol: 'staff',
      activo: true,
    },
  ];

  for (const s of staff) {
    await set(`usuario:${s.id}`, s);
    await set(`usuario:dni:${s.dni}`, s);
  }

  // 3. Jugadores
  console.log('👥 Creating players...');
  const jugadores = [
    { dni: '45123456', nombre: 'Juan Pérez', categoria_id: 'cat-m17' },
    { dni: '44567890', nombre: 'Martín Gómez', categoria_id: 'cat-m17' },
    { dni: '46234567', nombre: 'Lucas Fernández', categoria_id: 'cat-m15' },
    { dni: '43876543', nombre: 'Santiago Ruiz', categoria_id: 'cat-primera' },
    { dni: '44111222', nombre: 'Sofía Álvarez', categoria_id: 'cat-femenino' },
  ];

  for (const [index, j] of jugadores.entries()) {
    const usuario = {
      id: `user-jugador-${index + 1}`,
      ...j,
      rol: 'jugador',
      activo: true,
    };
    await set(`usuario:${usuario.id}`, usuario);
    await set(`usuario:dni:${usuario.dni}`, usuario);
  }

  // 4. Rutina M17
  console.log('💪 Creating routines...');
  const rutinaM17 = {
    id: 'rutina-m17-1',
    categoria_id: 'cat-m17',
    nombre: 'Fuerza - Semana 1',
    fecha_inicio: '2026-01-13',
    fecha_fin: '2026-02-13',
  };

  await set(`rutina:${rutinaM17.id}`, rutinaM17);
  await lpush(`rutinas:categoria:cat-m17`, rutinaM17);

  // 5. Ejercicios para rutina M17 - POR DÍA
  console.log('🏋️ Creating exercises...');

  const ejerciciosPorDia = {
    lunes: [
      { nombre: 'Sentadilla', series: 4, repeticiones: 8, rir: 2, orden: 1 },
      { nombre: 'Press Banca', series: 4, repeticiones: 10, rir: 2, orden: 2 },
      { nombre: 'Remo con Barra', series: 3, repeticiones: 10, rir: 2, orden: 3 },
    ],
    miercoles: [
      { nombre: 'Peso Muerto', series: 4, repeticiones: 6, rir: 3, orden: 1 },
      { nombre: 'Press Militar', series: 3, repeticiones: 10, rir: 3, orden: 2 },
      { nombre: 'Dominadas', series: 3, repeticiones: 8, rir: 2, orden: 3 },
    ],
    viernes: [
      { nombre: 'Sentadilla Frontal', series: 4, repeticiones: 8, rir: 2, orden: 1 },
      { nombre: 'Press Inclinado', series: 4, repeticiones: 10, rir: 2, orden: 2 },
      { nombre: 'Peso Muerto Rumano', series: 3, repeticiones: 10, rir: 2, orden: 3 },
    ],
  };

  let ejercicioIndex = 1;
  for (const [dia, ejercicios] of Object.entries(ejerciciosPorDia)) {
    for (const ej of ejercicios) {
      const ejercicio = {
        id: `ejercicio-${ejercicioIndex}`,
        rutina_id: rutinaM17.id,
        dia: dia,
        ...ej,
      };
      await set(`ejercicio:${ejercicio.id}`, ejercicio);
      await lpush(`ejercicios:rutina:${rutinaM17.id}`, ejercicio);
      ejercicioIndex++;
    }
  }

  await redis.quit();
  console.log('\n✅ Seed completed!');
  console.log('\n📝 Demo users:');
  console.log('   Jugador: 45123456 (Juan Pérez)');
  console.log('   Staff:   20345678 (Lucas Salvador)\n');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Error seeding:', error);
  process.exit(1);
});

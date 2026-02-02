#!/usr/bin/env node

import Redis from 'ioredis';
import { config } from 'dotenv';

// Cargar .env.local por defecto; en producción usar SANMARTIN_REDIS_URL o REDIS_URL
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
    { dni: '45123456', nombre: 'Juan Pérez', categoria_id: 'cat-m17', fecha_nacimiento: '2008-03-15' },
    { dni: '44567890', nombre: 'Martín Gómez', categoria_id: 'cat-m17', fecha_nacimiento: '2007-11-20' },
    { dni: '46234567', nombre: 'Lucas Fernández', categoria_id: 'cat-m15', fecha_nacimiento: '2010-05-08' },
    { dni: '43876543', nombre: 'Santiago Ruiz', categoria_id: 'cat-primera', fecha_nacimiento: '2003-01-12' },
    { dni: '44111222', nombre: 'Sofía Álvarez', categoria_id: 'cat-femenino', fecha_nacimiento: '2006-09-25' },
  ];

  for (const [index, j] of jugadores.entries()) {
    const usuario = {
      id: `user-jugador-${index + 1}`,
      dni: j.dni,
      nombre: j.nombre,
      categoria_id: j.categoria_id,
      fecha_nacimiento: j.fecha_nacimiento,
      rol: 'jugador',
      activo: true,
    };
    await set(`usuario:${usuario.id}`, usuario);
    await set(`usuario:dni:${usuario.dni}`, usuario);
  }

  // 4. Plantillas de ejercicios (catálogo)
  console.log('📋 Creating exercise templates...');
  const plantillasData = [
    { nombre: 'Sentadilla', series_default: 4, rir_default: 2, repeticiones_default: 8, tipo: 'empuje', musculo_principal: 'Cuádriceps', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Mantener espalda recta, bajar hasta paralelo.' },
    { nombre: 'Press Banca', series_default: 4, rir_default: 2, repeticiones_default: 10, tipo: 'empuje', musculo_principal: 'Pectorales', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Escápulas retraídas, pies apoyados.' },
    { nombre: 'Remo con Barra', series_default: 3, rir_default: 2, repeticiones_default: 10, tipo: 'traccion', musculo_principal: 'Dorsales', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Llevar codos hacia atrás, contraer dorsales.' },
    { nombre: 'Peso Muerto', series_default: 4, rir_default: 3, repeticiones_default: 6, tipo: 'empuje', musculo_principal: 'Isquiotibiales', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Hip hinge, mantener barra cerca del cuerpo.' },
    { nombre: 'Press Militar', series_default: 3, rir_default: 3, repeticiones_default: 10, tipo: 'empuje', musculo_principal: 'Hombros', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Core firme, no arquear la espalda.' },
    { nombre: 'Dominadas', series_default: 3, rir_default: 2, repeticiones_default: 8, tipo: 'traccion', musculo_principal: 'Dorsales', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Agarre prono o neutro, subir hasta la barbilla.' },
    { nombre: 'Sentadilla Frontal', series_default: 4, rir_default: 2, repeticiones_default: 8, tipo: 'empuje', musculo_principal: 'Cuádriceps', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Codos altos, torso erguido.' },
    { nombre: 'Press Inclinado', series_default: 4, rir_default: 2, repeticiones_default: 10, tipo: 'empuje', musculo_principal: 'Pectorales', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Banco 30-45°, énfasis en porción superior.' },
    { nombre: 'Peso Muerto Rumano', series_default: 3, rir_default: 2, repeticiones_default: 10, tipo: 'empuje', musculo_principal: 'Isquiotibiales', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Piernas casi rectas, flexión de cadera.' },
    { nombre: 'Curl de Bíceps', series_default: 3, rir_default: 2, repeticiones_default: 12, tipo: 'traccion', musculo_principal: 'Bíceps', modo_serie: 'serie_x_repeticion', ayuda_alumno: 'Codos fijos, controlar la bajada.' },
  ];

  const plantillasIds = {};
  for (let i = 0; i < plantillasData.length; i++) {
    const id = `plantilla-ej-seed-${i + 1}`;
    const plantilla = { id, ...plantillasData[i] };
    await set(`plantilla-ejercicio:${id}`, plantilla);
    plantillasIds[plantillasData[i].nombre] = id;
  }

  // 5. Rutina M17
  console.log('💪 Creating routines...');
  const rutinaM17 = {
    id: 'rutina-m17-1',
    categoria_id: 'cat-m17',
    nombre: 'Fuerza - Semana 1',
    fecha_inicio: '2026-01-13',
    fecha_fin: '2026-02-13',
    semanas: 5,
    dias_config: {
      lunes: 'ejercicio',
      martes: 'descanso',
      miercoles: 'ejercicio',
      jueves: 'descanso',
      viernes: 'ejercicio',
      sabado: 'partido',
    },
  };

  await set(`rutina:${rutinaM17.id}`, rutinaM17);
  await lpush(`rutinas:categoria:cat-m17`, rutinaM17);

  // 6. Ejercicios para rutina M17 (referencian plantillas)
  console.log('🏋️ Creating routine exercises...');

  const ejerciciosRutina = [
    { dia: 'lunes', plantilla: 'Sentadilla', series: 4, orden: 1 },
    { dia: 'lunes', plantilla: 'Press Banca', series: 4, orden: 2 },
    { dia: 'lunes', plantilla: 'Remo con Barra', series: 3, orden: 3 },
    { dia: 'miercoles', plantilla: 'Peso Muerto', series: 4, orden: 1 },
    { dia: 'miercoles', plantilla: 'Press Militar', series: 3, orden: 2 },
    { dia: 'miercoles', plantilla: 'Dominadas', series: 3, orden: 3 },
    { dia: 'viernes', plantilla: 'Sentadilla Frontal', series: 4, orden: 1 },
    { dia: 'viernes', plantilla: 'Press Inclinado', series: 4, orden: 2 },
    { dia: 'viernes', plantilla: 'Peso Muerto Rumano', series: 3, orden: 3 },
    { dia: 'viernes', plantilla: 'Curl de Bíceps', series: 3, orden: 4 },
  ];

  const configPorSemana = (s, r) => ({
    1: { series: s, rir: r },
    2: { series: s, rir: r },
    3: { series: s, rir: Math.max(0, r - 1) },
    4: { series: s, rir: Math.max(0, r - 2) },
    5: { series: s, rir: Math.max(0, r - 2) },
  });

  let ejercicioIndex = 1;
  for (const ej of ejerciciosRutina) {
    const plantilla = plantillasData.find((p) => p.nombre === ej.plantilla);
    const config = configPorSemana(ej.series, plantilla.rir_default);
    const ejercicio = {
      id: `ejercicio-${ejercicioIndex}`,
      rutina_id: rutinaM17.id,
      ejercicio_plantilla_id: plantillasIds[ej.plantilla],
      dia: ej.dia,
      nombre: ej.plantilla,
      series: ej.series,
      repeticiones: plantilla.repeticiones_default,
      rir: plantilla.rir_default,
      orden: ej.orden,
      config_por_semana: config,
    };
    await set(`ejercicio:${ejercicio.id}`, ejercicio);
    await lpush(`ejercicios:rutina:${rutinaM17.id}`, ejercicio);
    ejercicioIndex++;
  }

  // 7. Un mes de progreso para Juan Pérez (user-jugador-1)
  console.log('📈 Creating 1 month progress for Juan Pérez...');
  const juanId = 'user-jugador-1';

  // Días de entrenamiento: lunes, miércoles, viernes (13 ene - 3 feb)
  const diasEntrenamiento = [
    { fecha: '2026-01-13', dia: 'lunes', ejercicioIds: ['ejercicio-1', 'ejercicio-2', 'ejercicio-3'] },
    { fecha: '2026-01-15', dia: 'miercoles', ejercicioIds: ['ejercicio-4', 'ejercicio-5', 'ejercicio-6'] },
    { fecha: '2026-01-17', dia: 'viernes', ejercicioIds: ['ejercicio-7', 'ejercicio-8', 'ejercicio-9', 'ejercicio-10'] },
    { fecha: '2026-01-20', dia: 'lunes', ejercicioIds: ['ejercicio-1', 'ejercicio-2', 'ejercicio-3'] },
    { fecha: '2026-01-22', dia: 'miercoles', ejercicioIds: ['ejercicio-4', 'ejercicio-5', 'ejercicio-6'] },
    { fecha: '2026-01-24', dia: 'viernes', ejercicioIds: ['ejercicio-7', 'ejercicio-8', 'ejercicio-9', 'ejercicio-10'] },
    { fecha: '2026-01-27', dia: 'lunes', ejercicioIds: ['ejercicio-1', 'ejercicio-2', 'ejercicio-3'] },
    { fecha: '2026-01-29', dia: 'miercoles', ejercicioIds: ['ejercicio-4', 'ejercicio-5', 'ejercicio-6'] },
    { fecha: '2026-01-31', dia: 'viernes', ejercicioIds: ['ejercicio-7', 'ejercicio-8', 'ejercicio-9', 'ejercicio-10'] },
    { fecha: '2026-02-03', dia: 'lunes', ejercicioIds: ['ejercicio-1', 'ejercicio-2', 'ejercicio-3'] },
  ];

  // Peso base por ejercicio (kg), sube ~2-5% por semana
  const pesoBase = {
    'ejercicio-1': 60,   // Sentadilla
    'ejercicio-2': 40,   // Press Banca
    'ejercicio-3': 35,   // Remo
    'ejercicio-4': 70,   // Peso Muerto
    'ejercicio-5': 25,   // Press Militar
    'ejercicio-6': 0,    // Dominadas (peso corporal, reps)
    'ejercicio-7': 50,   // Sentadilla Frontal
    'ejercicio-8': 35,   // Press Inclinado
    'ejercicio-9': 40,   // Peso Muerto Rumano
    'ejercicio-10': 12,  // Curl Bíceps
  };

  const repsBase = {
    'ejercicio-1': 8, 'ejercicio-2': 10, 'ejercicio-3': 10, 'ejercicio-4': 6,
    'ejercicio-5': 10, 'ejercicio-6': 8, 'ejercicio-7': 8, 'ejercicio-8': 10,
    'ejercicio-9': 10, 'ejercicio-10': 12,
  };

  const registrosJuan = [];
  for (const sesion of diasEntrenamiento) {
    const semana = Math.floor(
      (new Date(sesion.fecha) - new Date('2026-01-13')) / (7 * 24 * 60 * 60 * 1000)
    ) + 1;
    const factorPeso = 1 + semana * 0.03; // +3% por semana

    await set(`asistencia:${juanId}:${sesion.fecha}`, {
      id: `asistencia:${juanId}:${sesion.fecha}`,
      usuario_id: juanId,
      fecha: sesion.fecha,
      timestamp: `${sesion.fecha}T18:30:00.000Z`,
    });

    for (const ejercicioId of sesion.ejercicioIds) {
      const base = pesoBase[ejercicioId] ?? 20;
      const reps = repsBase[ejercicioId] ?? 8;
      const peso = Math.round((base * factorPeso) * 2) / 2;
      for (let serie = 1; serie <= 2; serie++) {
        registrosJuan.push({
          id: `registro-juan-${sesion.fecha}-${ejercicioId.replace('ejercicio-', '')}-${serie}`,
          usuario_id: juanId,
          ejercicio_id: ejercicioId,
          peso: ejercicioId === 'ejercicio-6' ? 0 : peso,
          reps: ejercicioId === 'ejercicio-6' ? 6 + serie : reps,
          serie_num: serie,
          fecha: sesion.fecha,
          timestamp: `${sesion.fecha}T18:${30 + serie}:00.000Z`,
        });
      }
    }
  }

  // Registros: ordenar de más reciente a más antiguo; lpush uno a uno (cada push va al inicio)
  registrosJuan.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  for (const reg of registrosJuan) {
    await lpush(`registros:jugador:${juanId}`, reg);
  }

  await redis.quit();
  console.log('\n✅ Seed completed!');
  console.log('\n📝 Demo users:');
  console.log('   Jugador: 45123456 (Juan Pérez) — 1 mes de progreso, 10 asistencias, registros de carga');
  console.log('   Staff:   20345678 (Lucas Salvador)');
  console.log('\n   Rutina activa: Fuerza - Semana 1 (2026-01-13 a 2026-02-13), 10 ejercicios.\n');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Error seeding:', error);
  process.exit(1);
});

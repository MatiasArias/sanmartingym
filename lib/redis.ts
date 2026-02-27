/**
 * Barrel: re-exporta cliente Redis y todos los módulos de dominio
 * para mantener compatibilidad con imports existentes desde @/lib/redis.
 */
export { redis, parse } from '@/lib/redis-client';

export type { Usuario } from '@/lib/usuarios';
export {
  getUsuarioByDni,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  getAllUsuarios,
  getJugadores,
  createJugador,
} from '@/lib/usuarios';

export type { Categoria } from '@/lib/categorias';
export { getAllCategorias, createCategoria } from '@/lib/categorias';

export type {
  TipoDia,
  Rutina,
  Ejercicio,
  EjercicioConAyuda,
  EjercicioEnRutinaInput,
} from '@/lib/rutinas';
export {
  getSemanaActual,
  calcularFechaFin,
  getRutinaById,
  getRutinaActivaByCategoria,
  getEjerciciosByRutina,
  getEjerciciosByRutinaYDia,
  getEjerciciosByRutinaYDiaConAyuda,
  getDiasDeRutina,
  getAllRutinas,
  createRutina,
  updateRutina,
  saveEjerciciosForRutina,
} from '@/lib/rutinas';

export type { EjercicioPlantilla, ConfigSemana } from '@/lib/ejercicios';
export {
  getAllPlantillasEjercicio,
  getPlantillaEjercicioById,
  createPlantillaEjercicio,
  updatePlantillaEjercicio,
  deletePlantillaEjercicio,
} from '@/lib/ejercicios';

export type { RegistroCarga } from '@/lib/registros';
export {
  getRegistrosByJugador,
  getEjerciciosConRegistros,
  getHistorialEjercicio,
} from '@/lib/registros';

export type { WellnessSesion, ReglaWellness } from '@/lib/wellness';
export {
  getWellnessRules,
  setWellnessRules,
  saveWellnessSesion,
  getWellnessSesion,
  getWellnessSesionesEnRango,
} from '@/lib/wellness';

export type { Asistencia, RpeSesion } from '@/lib/asistencia';
export {
  getAsistenciasPorFecha,
  getAsistenciasJugadorEnRango,
  saveRpeSesion,
  getRpeSesion,
  getRpeSesionesEnRango,
} from '@/lib/asistencia';

export type { ComentarioEjercicio, ComentarioResuelto } from '@/lib/comentarios';
export {
  addComentarioEjercicio,
  getComentariosByEjercicio,
  getComentariosByEjercicios,
  getComentariosNoResueltosByEjercicios,
  markComentarioResuelto,
  getComentariosResueltos,
  getComentariosNuevosCount,
  marcarComentariosVistos,
} from '@/lib/comentarios';

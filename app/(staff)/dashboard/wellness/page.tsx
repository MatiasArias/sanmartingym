import { getTokenPayload } from '@/lib/auth';
import { getWellnessRules } from '@/lib/redis';
import ReglasWellnessForm from './ReglasWellnessForm';

export default async function WellnessPage() {
  const payload = await getTokenPayload();
  if (!payload || payload.rol !== 'staff') {
    return null;
  }
  const rules = await getWellnessRules();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reglas Wellness</h1>
        <p className="text-sm text-gray-600 mt-1">
          Definí cómo se adapta la rutina según el cuestionario wellness (puntajes 1-5). Bienestar se calcula con sueño y energía; cansancio usa estrés/cansancio mental.
        </p>
      </div>

      <ReglasWellnessForm reglasIniciales={rules} />
    </div>
  );
}

/**
 * Bloque estándar para mostrar mensajes de error arriba de formularios.
 * Patrón unificado: banner rojo con texto.
 */
export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm"
      role="alert"
    >
      {message}
    </div>
  );
}

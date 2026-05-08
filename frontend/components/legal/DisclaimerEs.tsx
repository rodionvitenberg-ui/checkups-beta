export function DisclaimerEs() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 font-medium text-right mb-8">Última actualización: 8 de mayo de 2026</p>
      
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
        <h3 className="text-red-800 font-bold text-lg mb-2">ADVERTENCIA: ESTE SERVICIO NO ES UN MÉDICO</h3>
        <p className="text-red-700 font-medium">
          La plataforma webdoc.life y sus tecnologías de inteligencia artificial no brindan consejos médicos, diagnósticos ni planes de tratamiento.
        </p>
      </div>

      <h3 className="text-lg font-bold mt-6 text-slate-800">1. Solo con fines informativos</h3>
      <p>Todos los materiales, interpretaciones de pruebas, gráficos y comentarios de texto generados por el servicio se proporcionan únicamente con fines informativos y educativos. Están diseñados para ayudarle a comprender mejor la estructura de sus documentos médicos, pero no sustituyen una opinión médica profesional.</p>

      <h3 className="text-lg font-bold mt-6 text-slate-800">2. Posibles errores de IA y OCR</h3>
      <p>Utilizamos reconocimiento óptico de caracteres (OCR) y modelos de lenguaje grande (LLM). Estas tecnologías son propensas a errores (alucinaciones). La IA podría reconocer incorrectamente un número en una foto borrosa o malinterpretar los rangos de referencia de un laboratorio. Usted es responsable de verificar los resultados del servicio con el informe de laboratorio original.</p>

      <h3 className="text-lg font-bold mt-6 text-slate-800">3. No a la automedicación</h3>
      <p>Nunca ignore el consejo médico profesional ni se demore en buscarlo por algo que haya leído en este sitio web. No modifique las dosis de sus medicamentos en base a informes generados por IA.</p>

      <h3 className="text-lg font-bold mt-6 text-slate-800">4. Emergencias médicas</h3>
      <p>Si cree que puede tener una emergencia médica, llame a su médico o a los servicios de emergencia de inmediato. El uso del servicio webdoc.life en situaciones de emergencia está estrictamente prohibido.</p>
    </div>
  );
}
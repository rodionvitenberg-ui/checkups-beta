export function PrivacyPolicyEs() {
  return (
    <div className="space-y-4">
      <p><strong>Última actualización:</strong> 6 de mayo de 2026</p>
      <p>Bienvenido a <strong>webdoc.life</strong>. Tomamos su privacidad médica con la mayor seriedad. Esta Política describe cómo procesamos y protegemos sus datos.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">1. Recopilación y procesamiento de datos</h3>
      <p>Cuando sube documentos médicos (PDF o imágenes) para su análisis, extraemos el texto de ellos. También almacenamos información básica del perfil (edad, género, datos biométricos) que usted proporciona voluntariamente para mejorar la precisión del análisis de IA.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">2. Anonimización de datos (Característica principal)</h3>
      <p>La seguridad de los datos personales es la base de nuestra arquitectura. Antes de que el texto del documento se envíe a los algoritmos de inteligencia artificial (LLM), pasa por un <strong>estricto sistema local de desidentificación (anonimizador PNL)</strong> en nuestros servidores seguros.</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Su nombre, datos de contacto y otra información de identificación personal (PII) se <strong>eliminan del texto</strong> y se reemplazan con tokens seguros.</li>
        <li>La Inteligencia Artificial recibe únicamente indicadores médicos "desinfectados".</li>
      </ul>

      <h3 className="text-lg font-bold mt-6 text-slate-800">3. Uso de Inteligencia Artificial</h3>
      <p>Utilizamos modelos avanzados de LLM para estructurar e interpretar datos médicos anonimizados. La IA proporciona información de referencia, que no constituye un diagnóstico médico. Los proveedores externos de IA no entrenan sus modelos con sus documentos.</p>

      <h3 className="text-lg font-bold mt-6 text-slate-800">4. Sus derechos</h3>
      <p>Tiene control total sobre sus datos. En su Panel de control, puede eliminar permanentemente los análisis subidos, el historial de indicadores o todo su perfil en cualquier momento con un solo clic.</p>
    </div>
  );
}
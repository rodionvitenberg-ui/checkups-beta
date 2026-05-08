export function CookiesEs() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 font-medium text-right mb-8">Última actualización: 8 de mayo de 2026</p>
      <p>En <strong>webdoc.life</strong>, utilizamos cookies exclusivamente para garantizar la funcionalidad básica del servicio.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">1. ¿Qué son las cookies?</h3>
      <p>Las cookies son pequeños archivos de texto que se guardan en su navegador al visitar sitios web. Ayudan a recordar configuraciones y a garantizar la seguridad.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">2. ¿Qué archivos utilizamos?</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Cookies técnicas:</strong> Necesarias para la autorización (tokens JWT) y para mantener el estado de su sesión.</li>
        <li><strong>Localización:</strong> Guardamos el idioma seleccionado (ru, en, es) para que no tenga que elegirlo de nuevo.</li>
      </ul>

      <h3 className="text-lg font-bold mt-6 text-slate-800">3. Gestión de cookies</h3>
      <p>Puede desactivar o eliminar las cookies en cualquier momento en la configuración de su navegador. Sin embargo, tenga en cuenta que sin ellas, la autorización y el área personal podrían no funcionar correctamente.</p>
    </div>
  );
}
export function CookiesEn() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 font-medium text-right mb-8">Last updated: May 8, 2026</p>
      <p>On <strong>webdoc.life</strong>, we use cookies exclusively to ensure the basic functionality of the service.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">1. What are cookies?</h3>
      <p>Cookies are small text files that are stored in your browser when you visit websites. They help remember settings and ensure security.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">2. Which files do we use?</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Technical cookies:</strong> Necessary for authorization (JWT tokens) and maintaining your session state.</li>
        <li><strong>Localization:</strong> We save your selected language (ru, en, es) so you don't have to choose it again.</li>
      </ul>

      <h3 className="text-lg font-bold mt-6 text-slate-800">3. Managing cookies</h3>
      <p>You can disable or delete cookies at any time in your browser settings. However, please note that without them, authorization and your personal account may not function correctly.</p>
    </div>
  );
}
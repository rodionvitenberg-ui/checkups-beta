export function CookiesRu() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 font-medium text-right mb-8">Последнее обновление: 8 мая 2026 г.</p>
      <p>На сайте <strong>webdoc.life</strong> мы используем файлы cookie исключительно для обеспечения базовой функциональности сервиса.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">1. Что такое файлы cookie?</h3>
      <p>Cookie — это небольшие текстовые файлы, которые сохраняются в вашем браузере при посещении сайтов. Они помогают запоминать настройки и обеспечивать безопасность.</p>
      
      <h3 className="text-lg font-bold mt-6 text-slate-800">2. Какие файлы мы используем?</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Технические куки:</strong> Необходимы для авторизации (JWT-токены) и сохранения состояния вашей сессии.</li>
        <li><strong>Локализация:</strong> Мы сохраняем выбранный вами язык (ru, en, es), чтобы вам не приходилось выбирать его заново.</li>
      </ul>

      <h3 className="text-lg font-bold mt-6 text-slate-800">3. Управление файлами cookie</h3>
      <p>Вы можете в любой момент отключить или удалить файлы cookie в настройках своего браузера. Однако помните, что без них авторизация и личный кабинет могут работать некорректно.</p>
    </div>
  );
}
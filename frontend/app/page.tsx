import Link from 'next/link';
import { FileUploader } from '@/components/home/FileUploader';
import { Activity, Brain, ShieldCheck, FileClock, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Контейнер с ограничением ширины для читаемости */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        
        {/* 1. Блок О ПРОЕКТЕ */}
        <section className="text-center mb-12 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Checkups AI
          </h1>
          <div className="prose prose-lg mx-auto text-slate-600 leading-relaxed">
            <p>
              Checkups — <span className="font-semibold text-blue-600">бесплатный интеллектуальный AI-сервис</span> по интерпретации медицинских анализов. 
              Мы используем новейшие AI-модели для анализа результатов ваших медицинских анализов, объясняем возможные причины отклонений от нормы. 
            </p>
            <p className="mt-4">
              Благодаря нам вы можете лучше понять первичную картину состояния вашего здоровья. 
              Мы не ставим диагнозов, мы помогаем вам получить независимое мнение, основанное на новейших технологиях искусственного интеллекта.
            </p>
          </div>
        </section>

        {/* 2. Кнопка загрузки (Компонент) */}
        <section className="mb-16">
          <FileUploader />
        </section>

        {/* 3. Четыре блока с текстом (Features) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Блок 1 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Виртуальный терапевт</h3>
            <p className="text-slate-600 text-sm">
              Отсматривает ваши результаты анализов, выявляет зоны риска, при этом вы экономите время и деньги.
            </p>
          </div>

          {/* Блок 2 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Возможные причины</h3>
            <p className="text-slate-600 text-sm">
              В отличие от анализов, где просто показаны отклонения от нормы, наш ИИ указывает на возможные причины.
            </p>
          </div>

          {/* Блок 3 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600">
              <FileClock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Всё в одном месте</h3>
            <p className="text-slate-600 text-sm">
              Доступ ко всем расшифровкам. В будущем — сравнение показателей в динамике и анализ изменений.
            </p>
          </div>

          {/* Блок 4 */}
          <div className="bg-slate-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-4 text-rose-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Риски и последствия</h3>
            <p className="text-slate-600 text-sm">
              Рассказываем о том, что может произойти, если те или иные показатели будут ухудшаться.
            </p>
          </div>
        </section>

        {/* 4. Кнопка "Посмотреть пример" */}
        <section className="mb-20">
          <Link 
            href="/example-analysis" // Ссылка пока ведет на заглушку
            className="group block w-full bg-slate-900 hover:bg-slate-800 text-white rounded-3xl py-6 px-8 text-center transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-semibold">Посмотреть пример разбора</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Узнайте, как выглядит результат работы ИИ без регистрации
            </p>
          </Link>
        </section>

        {/* 5. Блок отзывов */}
        <section className="text-center border-t border-slate-100 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Что говорят пользователи</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Заглушки для отзывов */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-left">
                <div className="flex items-center gap-1 text-yellow-400 mb-3">
                  {'★'.repeat(5)}
                </div>
                <p className="text-slate-600 text-sm mb-4">
                  "Отличный сервис! Очень помог разобраться с анализом крови. Теперь понимаю, о чем говорить с врачом."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                  <span className="text-sm font-medium text-slate-900">Пользователь #{i}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
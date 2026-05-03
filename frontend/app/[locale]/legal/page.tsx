'use client';

import { useQuery } from '@tanstack/react-query';
import { getLegalDocuments, LegalDocument } from '@/lib/api';
import { Loader2, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function LegalPage() {
    // Получаем документы из нашего нового отдельного API
    const { data: docs = [], isLoading } = useQuery({
        queryKey: ['legalDocuments'],
        queryFn: getLegalDocuments
    });

    // Превращаем массив в словарь по ключам для удобства
    const docsMap = docs.reduce((acc, doc) => {
        acc[doc.slug] = doc;
        return acc;
    }, {} as Record<string, LegalDocument>);

    const terms = docsMap['terms'];
    const privacy = docsMap['privacy'];

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-12">
                
                {/* ШАПКА ДОКУМЕНТА */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12 border-b border-slate-100 pb-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                        <Scale className="w-8 h-8 text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Юридическая информация
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Политика конфиденциальности и пользовательское соглашение
                        </p>
                    </div>
                </div>

                <div className="space-y-16">
                    {/* ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ */}
                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {terms?.title || 'Пользовательское соглашение'}
                            </h2>
                            {terms?.updated_at && (
                                <span className="text-sm text-slate-400 font-medium">
                                    Обновлено: {format(new Date(terms.updated_at), 'd MMMM yyyy', { locale: ru })}
                                </span>
                            )}
                        </div>
                        
                        <div className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-600">
                            {terms?.content ? (
                                <div dangerouslySetInnerHTML={{ __html: terms.content.replace(/\n/g, '<br/>') }} />
                            ) : (
                                <p className="italic bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200">
                                    Текст пользовательского соглашения будет добавлен позже. (Для добавления перейдите в раздел "Юридическая информация" в CMS).
                                </p>
                            )}
                        </div>
                    </section>

                    <hr className="border-slate-100" />

                    {/* ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ */}
                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {privacy?.title || 'Политика конфиденциальности'}
                            </h2>
                            {privacy?.updated_at && (
                                <span className="text-sm text-slate-400 font-medium">
                                    Обновлено: {format(new Date(privacy.updated_at), 'd MMMM yyyy', { locale: ru })}
                                </span>
                            )}
                        </div>

                        <div className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-600">
                            {privacy?.content ? (
                                <div dangerouslySetInnerHTML={{ __html: privacy.content.replace(/\n/g, '<br/>') }} />
                            ) : (
                                <p className="italic bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200">
                                    Текст политики конфиденциальности будет добавлен позже. (Для добавления перейдите в раздел "Юридическая информация" в CMS).
                                </p>
                            )}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}
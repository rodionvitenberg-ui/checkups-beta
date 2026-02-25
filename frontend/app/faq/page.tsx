'use client';

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { getFaqs } from '@/lib/api';

export default function FAQPage() {
  // Получаем данные из CMS
  const { data: faqData = [], isLoading } = useQuery({
      queryKey: ['faqs'],
      queryFn: getFaqs
  });

  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) => 
      prev.includes(id) 
        ? prev.filter((item) => item !== id) 
        : [...prev, id]
    );
  };

  return (
    <section className="min-h-[calc(100vh-64px)] bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8 md:pt-36 md:pb-24">
      <div className="w-full max-w-7xl mx-auto">
          
          <div className="mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight uppercase">
                Вопросы и Ответы
            </h1>
            <p className="text-lg text-slate-500 mt-4 max-w-2xl">
                Узнайте, как работает наш сервис, как мы защищаем ваши данные и чем мы можем помочь вашему здоровью.
            </p>
          </div>

          {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                  <p>Загружаем ответы...</p>
              </div>
          ) : faqData.length === 0 ? (
              <div className="text-center py-20 text-slate-500 bg-white rounded-[2.5rem] border border-slate-200">
                  Пока здесь нет вопросов. Загляните позже!
              </div>
          ) : (
              /* LayoutGroup помогает плавно анимировать изменения высоты */
              <LayoutGroup>
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch">
                      
                      {/* ЛЕВАЯ КОЛОНКА (Аккордеон) */}
                      <div className="flex-1 flex flex-col gap-4">
                          {faqData.map((item) => (
                              <FAQItem 
                                key={item.id} 
                                item={item} 
                                isOpen={openItems.includes(item.id)}
                                toggle={() => toggleItem(item.id)}
                              />
                          ))}
                      </div>

                      {/* ПРАВАЯ КОЛОНКА (Изображение) */}
                      <motion.div 
                        layout 
                        className="hidden lg:block w-[40%] relative min-h-[500px]"
                      >
                          {/* h-full растягивает блок на всю высоту соседней колонки */}
                          <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-slate-200 relative translate-z-0 shadow-sm border border-slate-200">
                              
                              <Image 
                                src="/art1.jpg" // Закинь картинку art1.jpg в папку public
                                alt="FAQ Art"
                                fill
                                sizes="(max-width: 1024px) 100vw, 40vw"
                                className="object-cover" 
                              />
                              
                              {/* Легкое затемнение снизу для читаемости текста */}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80 pointer-events-none" />

                              {/* Декор */}
                              <div className="absolute bottom-10 left-10 max-w-[250px] z-10 pointer-events-none">
                                  <p className="text-white/90 font-medium text-sm leading-relaxed">
                                     Остались вопросы? 
                                     <br/>
                                     <span className="text-blue-300 cursor-pointer hover:text-blue-200 hover:underline mt-2 block pointer-events-auto transition-colors">
                                        Свяжитесь с нами
                                     </span>
                                  </p>
                              </div>

                          </div>
                      </motion.div>

                  </div>
              </LayoutGroup>
          )}

      </div>
    </section>
  );
}

// Компонент одного вопроса
function FAQItem({ item, isOpen, toggle }: { item: any, isOpen: boolean, toggle: () => void }) {
    return (
        <motion.div 
            layout 
            onClick={toggle}
            className={clsx(
                "group cursor-pointer border rounded-[2rem] p-6 md:p-8 transition-colors duration-200",
                isOpen 
                    ? "bg-white border-blue-200 shadow-sm" 
                    : "bg-white/50 border-slate-200 hover:border-blue-300 hover:bg-white"
            )}
        >
            <motion.div layout className="flex justify-between items-start gap-4">
                <div className="flex gap-4 md:gap-6 items-start">
                    <h3 className={clsx(
                        "text-lg md:text-xl font-bold leading-tight transition-colors",
                        isOpen ? "text-blue-600" : "text-slate-900 group-hover:text-blue-600"
                    )}>
                        {item.question}
                    </h3>
                </div>
                
                <div className={clsx(
                    "shrink-0 w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300",
                    isOpen 
                        ? "bg-blue-600 text-white border-blue-600 rotate-45" 
                        : "bg-slate-50 text-slate-400 border-slate-200 group-hover:border-blue-300 group-hover:text-blue-500"
                )}>
                   <Plus className="w-5 h-5" />
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl">
                            {/* Выводим ответ с сохранением переносов строк */}
                            <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/\n/g, '<br/>') }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
'use client';

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { getFaqs } from '@/lib/api';

export default function FAQSection() {
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
    <section className="py-5 md:py-5">
      <div className="max-w-6xl mx-auto">
          
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">
                Вопросы и Ответы
            </h2>
            <p className="text-lg text-slate-600 mt-4 max-w-xl font-medium">
                Узнайте больше о работе нашего сервиса и о том, как мы заботимся о вашем здоровье.
            </p>
          </div>

          {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
          ) : (
              <LayoutGroup>
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                      
                      {/* ЛЕВАЯ КОЛОНКА (Аккордеон) — ограничена по ширине (max-w-2xl) */}
                      <div className="w-full lg:max-w-2xl flex flex-col gap-4">
                          {faqData.map((item) => (
                              <FAQItem 
                                key={item.id} 
                                item={item} 
                                isOpen={openItems.includes(item.id)}
                                toggle={() => toggleItem(item.id)}
                              />
                          ))}
                      </div>

                      {/* ПРАВАЯ КОЛОНКА (Изображение БЕЗ фона) */}
<div className="hidden lg:block flex-1 relative self-stretch min-h-[400px] group"> {/* Добавили group для ховера */}
    
    {/* Контейнер теперь прозрачный, без границ и теней. 
        Sticky оставляем, чтобы картинка ехала за скроллом. */}
    <div className="sticky top-24 w-full h-full overflow-hidden flex items-center justify-center">
        
        <Image 
          src="/art1.png" // Убедись, что это PNG с прозрачным фоном
          alt="FAQ Art"
          fill
          className="object-contain transition-transform duration-700 ease-out" // Чистый contain + анимация увеличения
          sizes="(max-w-1024px) 100vw, 40vw"
        />
        
        {/* Убрали градиент затемнения, он больше не нужен */}
    </div>
</div>

                  </div>
              </LayoutGroup>
          )}
      </div>
    </section>
  );
}

function FAQItem({ item, isOpen, toggle }: { item: any, isOpen: boolean, toggle: () => void }) {
    return (
        <motion.div 
            layout 
            onClick={toggle}
            className={clsx(
                "group cursor-pointer border rounded-[2rem] p-6 transition-all duration-300",
                // Границы теперь видны всегда, но меняют цвет
                isOpen 
                    ? "bg-white/60 backdrop-blur-md border-blue-400/50 shadow-md" 
                    : "bg-white/30 backdrop-blur-sm border-slate-300/60 hover:border-blue-400/50 hover:bg-white/40"
            )}
        >
            <motion.div layout className="flex justify-between items-center gap-4">
                <h3 className={clsx(
                    "text-lg font-bold leading-tight transition-colors uppercase tracking-tight",
                    isOpen ? "text-blue-600" : "text-slate-800 group-hover:text-blue-600"
                )}>
                    {item.question}
                </h3>
                
                <div className={clsx(
                    "shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300",
                    isOpen 
                        ? "bg-blue-600 text-white border-blue-600 rotate-45" 
                        : "bg-white/50 text-slate-400 border-slate-300 group-hover:border-blue-400 group-hover:text-blue-600"
                )}>
                   <Plus className="w-4 h-4" />
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-5 text-base text-slate-700 font-medium leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/\n/g, '<br/>') }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
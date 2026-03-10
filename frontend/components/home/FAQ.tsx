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
            {/* Заменили font-black на font-bold, а цвет на text-secondary */}
            <h2 className="text-4xl md:text-5xl font-bold text-secondary tracking-tighter uppercase">
                Вопросы и Ответы
            </h2>
            {/* Цвет описания заменили на text-accent */}
            <p className="text-lg text-accent mt-4 max-w-xl font-medium">
                Узнайте больше о работе нашего сервиса и о том, как мы заботимся о вашем здоровье.
            </p>
          </div>

          {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                  {/* Лоадер теперь тоже использует цвет secondary */}
                  <Loader2 className="w-10 h-10 animate-spin text-secondary" />
              </div>
          ) : (
              <LayoutGroup>
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                      
                      {/* ЛЕВАЯ КОЛОНКА (Аккордеон) */}
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

                      {/* ПРАВАЯ КОЛОНКА (Изображение) */}
                      <div className="hidden lg:block flex-1 relative self-stretch min-h-[400px] group">
                          <div className="sticky top-24 w-full h-full overflow-hidden flex items-center justify-center">
                              <Image 
                                src="/art1.png" 
                                alt="FAQ Art"
                                fill
                                className="object-contain transition-transform duration-700 ease-out"
                                sizes="(max-w-1024px) 100vw, 40vw"
                              />
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
                // При активном состоянии и при ховере меняем обводку на secondary/50
                isOpen 
                    ? "bg-white/60 backdrop-blur-md border-secondary/50 shadow-md" 
                    : "bg-white/30 backdrop-blur-sm border-slate-300/60 hover:border-secondary/50 hover:bg-white/40"
            )}
        >
            <motion.div layout className="flex justify-between items-center gap-4">
                <h3 className={clsx(
                    "text-lg font-bold leading-tight transition-colors uppercase tracking-tight",
                    // Без ховера - accent, при ховере или открытии - secondary
                    isOpen ? "text-secondary" : "text-accent group-hover:text-secondary"
                )}>
                    {item.question}
                </h3>
                
                <div className={clsx(
                    "shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300",
                    // Без ховера - иконка accent, при ховере или открытии - красится в secondary
                    isOpen 
                        ? "bg-secondary text-white border-secondary rotate-45" 
                        : "bg-white/50 text-accent border-slate-300 group-hover:border-secondary group-hover:text-secondary"
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
                        {/* Текст ответа выводится цветом accent, без курсива */}
                        <div className="pt-5 text-base text-accent font-medium leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/\n/g, '<br/>') }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
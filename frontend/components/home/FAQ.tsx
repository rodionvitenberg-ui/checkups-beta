'use client';

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus } from "lucide-react";
import Image from "next/image";
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';

// Описываем тип для элемента FAQ, чтобы TypeScript был счастлив
interface FAQItemType {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const t = useTranslations('FAQ');
  // Достаем массив вопросов из JSON и говорим TS, как он выглядит
  const faqData = t.raw('items') as FAQItemType[];

  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) => 
      prev.includes(index) 
        ? prev.filter((item) => item !== index) 
        : [...prev, index]
    );
  };

  return (
    <section className="py-5 md:py-5">
      <div className="max-w-6xl mx-auto">
          
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary tracking-tighter uppercase">
                {t('title')}
            </h2>
            <p className="text-lg text-accent mt-4 max-w-xl font-medium">
                {t('subtitle')}
            </p>
          </div>

          <LayoutGroup>
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                  
                  {/* ЛЕВАЯ КОЛОНКА (Аккордеон) */}
                  <div className="w-full lg:max-w-2xl flex flex-col gap-4">
                      {faqData.map((item, index) => (
                          <FAQItem 
                            key={index} // Используем индекс как ключ
                            item={item} 
                            isOpen={openItems.includes(index)}
                            toggle={() => toggleItem(index)}
                          />
                      ))}
                  </div>

                  {/* ПРАВАЯ КОЛОНКА (Изображение) */}
                  <div className="hidden lg:block flex-1 relative self-stretch min-h-[400px] group">
                      <div className="sticky top-24 w-full h-full overflow-hidden flex items-center justify-center">
                          <Image 
                            src="/arts/6.png"
                            alt="FAQ Art"
                            fill
                            className="object-contain transition-transform duration-700 ease-out"
                            sizes="(max-w-1024px) 100vw, 40vw"
                          />
                      </div>
                  </div>

              </div>
          </LayoutGroup>
      </div>
    </section>
  );
}

function FAQItem({ item, isOpen, toggle }: { item: FAQItemType, isOpen: boolean, toggle: () => void }) {
    return (
        <motion.div 
            layout 
            onClick={toggle}
            className={clsx(
                "group cursor-pointer border rounded-[2rem] p-6 transition-all duration-300",
                isOpen 
                    ? "bg-white/60 backdrop-blur-md border-secondary/50 shadow-md" 
                    : "bg-white/30 backdrop-blur-sm border-slate-300/60 hover:border-secondary/50 hover:bg-white/40"
            )}
        >
            <motion.div layout className="flex justify-between items-center gap-4">
                <h3 className={clsx(
                    "text-lg font-bold leading-tight transition-colors uppercase tracking-tight",
                    isOpen ? "text-secondary" : "text-accent group-hover:text-secondary"
                )}>
                    {item.question}
                </h3>
                
                <div className={clsx(
                    "shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300",
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
                        <div className="pt-5 text-base text-accent font-medium leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/\n/g, '<br/>') }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
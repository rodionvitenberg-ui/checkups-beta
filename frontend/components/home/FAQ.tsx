'use client';

import { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus } from "lucide-react";
import Image from "next/image";
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';

interface FAQItemType {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const t = useTranslations('FAQ');
  const faqData = t.raw('items') as FAQItemType[];

  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) => 
      prev.includes(index) 
        ? prev.filter((item) => item !== index) 
        : [...prev, index]
    );
  };

  const imageScale = useMemo(() => {
    return 1 + (openItems.length * 0.1);
  }, [openItems.length]);

  return (
    <section className="py-5 md:py-10">
      <div className="max-w-6xl mx-auto px-4">
          
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary tracking-tighter uppercase">
                {t('title')}
            </h2>
            <p className="text-lg text-accent mt-4 max-w-xl font-medium">
                {t('subtitle')}
            </p>
          </div>

          <LayoutGroup>
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                  
                  {/* ЛЕВАЯ КОЛОНКА (Аккордеон) */}
                  <div className="w-full lg:max-w-2xl flex flex-col gap-4">
                      {faqData.map((item, index) => (
                          <FAQItem 
                            key={index}
                            item={item} 
                            isOpen={openItems.includes(index)}
                            toggle={() => toggleItem(index)}
                          />
                      ))}
                  </div>

                  {/* ПРАВАЯ КОЛОНКА (Динамическое изображение) */}
                  {/* Добавлены justify-end и lg:pl-16 для начального смещения */}
                  <div className="hidden lg:flex flex-1 relative self-stretch justify-end lg:pl-16">
                      <div className="sticky top-32 w-full h-[500px] flex items-center justify-end">
                          <motion.div 
                            layout
                            animate={{ 
                                scale: imageScale,
                                // Динамически отодвигаем изображение вправо за каждую вкладку
                                x: openItems.length * 16, 
                                rotate: openItems.length > 0 ? 2 : 0 
                            }}
                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                            // origin-right заставляет картинку масштабироваться от правого края, а не из центра
                            className="relative w-full h-full origin-right"
                          >
                              <Image 
                                src="/arts/6.png"
                                alt="FAQ Art"
                                fill
                                className="object-contain will-change-transform"
                                sizes="40vw"
                                priority
                              />
                          </motion.div>
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

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
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
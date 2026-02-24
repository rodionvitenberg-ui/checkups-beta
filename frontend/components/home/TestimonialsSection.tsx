'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TestimonialCarousel from '@/components/ui/testimonial-carousel';
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, X, Upload, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTestimonials, createTestimonial } from '@/lib/api';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');

// Функция генерации заглушки-аватарки (как в Google)
const generateAvatar = (name: string) => {
  const letter = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#3b82f6"/><text x="50" y="54" font-family="system-ui, sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
  // Кодируем в Base64 для безопасного использования в src
  return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : ''}`;
};

export function TestimonialsSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Получаем отзывы из БД
  const { data: testimonials = [], isLoading } = useQuery({
      queryKey: ['testimonials'],
      queryFn: getTestimonials
  });

  // Мутация для отправки нового отзыва
  const mutation = useMutation({
      mutationFn: createTestimonial,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['testimonials'] }); // Мгновенно обновляем список
          setIsModalOpen(false);
          setName('');
          setText('');
          setFile(null);
          setPreviewUrl(null);
      }
  });

  // Проверка авторизации перед открытием модалки
  const handleOpenModal = () => {
      const token = localStorage.getItem('token');
      if (!token) {
          router.push('/auth');
          return;
      }
      setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const selectedFile = e.target.files[0];
          setFile(selectedFile);
          setPreviewUrl(URL.createObjectURL(selectedFile));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('name', name);
      formData.append('text', text);
      if (file) {
          formData.append('avatar', file);
      }
      mutation.mutate(formData);
  };

  // Преобразуем данные из БД для нашей карусели
  const carouselData = testimonials.map(t => ({
      description: t.text,
      image: t.avatar ? `${BACKEND_URL}${t.avatar}` : generateAvatar(t.name),
      name: t.name,
      handle: '@' + t.name.toLowerCase().replace(/\s+/g, '_') // Генерируем фейковый handle (никнейм) для красоты
  }));

  // Если БД пока пустая, показываем приглашение
  const displayData = carouselData.length > 0 ? carouselData : [
    {
      description: 'Здесь пока нет отзывов. Станьте первым!',
      image: generateAvatar('Checkups'),
      name: 'Checkups',
      handle: '@checkups'
    }
  ];

  return (
    <section className="py-16 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          Что говорят пользователи
        </h2>
        
        {isLoading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        ) : (
            <div className="mb-10">
              <TestimonialCarousel data={displayData} />
            </div>
        )}
        
        <Button onClick={handleOpenModal} className="gap-2" size="lg">
          <MessageSquarePlus className="w-5 h-5" />
          Добавить свой отзыв
        </Button>
      </div>

      {/* ВСПЛЫВАЮЩЕЕ ОКНО (МОДАЛКА) ДЛЯ НАПИСАНИЯ ОТЗЫВА */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-900">Ваш отзыв</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 shadow-sm border border-slate-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Как вас зовут?</label>
                        <input 
                            required
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            placeholder="Например: Иван Иванов"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Поделитесь впечатлениями</label>
                        <textarea 
                            required
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[120px] resize-none transition-all"
                            placeholder="Расскажите, чем вам помог сервис..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Фотография (по желанию)</label>
                        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div 
                                className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div className="text-xs text-slate-500 leading-relaxed">
                                Нажмите на кружок, чтобы загрузить аватарку.<br/>
                                Если не загружать, мы сгенерируем красивую картинку с вашей первой буквой.
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-6 rounded-xl text-base font-semibold mt-2 shadow-lg shadow-blue-200" disabled={mutation.isPending}>
                        {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Опубликовать'}
                    </Button>
                </form>
            </div>
        </div>
      )}
    </section>
  );
}
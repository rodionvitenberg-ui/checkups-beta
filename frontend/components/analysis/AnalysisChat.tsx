'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, MessageSquare, X, Loader2, Bot, User } from 'lucide-react';
import { clsx } from 'clsx';
import { streamAnalysisChat, getChatHistory } from '@/lib/api'; // Добавили getChatHistory
import { useTranslations } from 'next-intl';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function AnalysisChat({ analysisUid }: { analysisUid: string }) {
    const t = useTranslations('Analysis.Chat');
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]); // Изначально пусто
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true); // Состояние загрузки истории
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // ЗАГРУЗКА ИСТОРИИ ИЗ БД
    useEffect(() => {
        if (mounted && analysisUid) {
            const loadHistory = async () => {
                try {
                    setIsInitialLoading(true);
                    const history = await getChatHistory(analysisUid);
                    
                    if (history && history.length > 0) {
                        setMessages(history);
                    } else {
                        // Если история пуста, добавляем приветствие
                        setMessages([{ 
                            role: 'assistant', 
                            content: t('greeting', { fallback: 'Здравствуйте! Я ваш медицинский ИИ-ассистент. Готов ответить на любые вопросы по вашему анализу.' }) 
                        }]);
                    }
                } catch (error) {
                    console.error("Failed to load chat history:", error);
                } finally {
                    setIsInitialLoading(false);
                }
            };
            loadHistory();
        }
    }, [mounted, analysisUid, t]);

    // Автоскролл
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            await streamAnalysisChat(analysisUid, newMessages, (chunk) => {
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    const updatedMessages = [...prev];
                    updatedMessages[updatedMessages.length - 1] = {
                        ...lastMessage,
                        content: lastMessage.content + chunk
                    };
                    return updatedMessages;
                });
            });
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].content = t('errorMsg', { fallback: 'Произошла ошибка при получении ответа.' });
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!mounted) return null;

    const chatContent = (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* КНОПКА ОТКРЫТИЯ */}
            <button
                onClick={() => setIsOpen(true)}
                className={clsx(
                    "absolute bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all duration-300 pointer-events-auto flex items-center justify-center hover:scale-110",
                    isOpen ? "opacity-0 scale-50 pointer-events-none" : "opacity-100"
                )}
            >
                <MessageSquare className="w-6 h-6" />
            </button>

            {/* ОКНО ЧАТА */}
            <div className={clsx(
                "absolute bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 pointer-events-auto origin-bottom-right",
                isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
            )}>
                {/* ХЕДЕР */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">AI Health Assistant</h3>
                            <p className="text-[10px] text-blue-100 font-medium">Контекст анализа подключен</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* СПИСОК СООБЩЕНИЙ */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {isInitialLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-xs">Загрузка истории...</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={clsx("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 mt-1">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className={clsx(
                                        "max-w-[80%] rounded-2xl p-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm",
                                        msg.role === 'user' 
                                            ? "bg-blue-600 text-white rounded-tr-sm" 
                                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                                    )}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-slate-500 mt-1">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* ИНПУТ */}
                <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                    <div className="relative flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 p-1.5 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isInitialLoading}
                            placeholder={t('inputPlaceholder', { fallback: 'Спросите о ваших показателях...' })}
                            className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2 px-3 text-sm text-slate-700"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || isInitialLoading}
                            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors mb-0.5 mr-0.5"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(chatContent, document.body);
}
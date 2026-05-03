'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AnalysisLoading({ isPolling }: { isPolling: boolean }) {
    const t = useTranslations('Analysis.Loading');
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState(t('defaultText'));

    useEffect(() => {
        if (!isPolling) {
            setProgress(100);
            setLoadingText(t('done'));
            return;
        }

        const texts = [
            t('texts.0'),
            t('texts.1'),
            t('texts.2'),
            t('texts.3'),
            t('texts.4'),
            t('texts.5')
        ];

        let currentProgress = 0;
        const progressInterval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 3) + 2; 
            if (currentProgress > 95) currentProgress = 98; 
            setProgress(currentProgress);

            if (currentProgress < 15) setLoadingText(texts[0]);
            else if (currentProgress < 30) setLoadingText(texts[1]);
            else if (currentProgress < 45) setLoadingText(texts[2]);
            else if (currentProgress < 65) setLoadingText(texts[3]);
            else if (currentProgress < 85) setLoadingText(texts[4]);
            else setLoadingText(texts[5]);

        }, 1500);

        return () => clearInterval(progressInterval);
    }, [isPolling, t]);

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative z-10 bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl shadow-[#3f94ca]/10 p-8 sm:p-12 flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-500">
            <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100/50" />
                    <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
                        className="text-[#00be64] transition-all duration-500 ease-out"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-slate-800">{progress}%</span>
                </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="w-5 h-5 text-[#3f94ca] animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900 text-center">{t('title')}</h3>
            </div>
            <p className="text-slate-500 text-center font-medium h-6 transition-all duration-300">
                {loadingText}
            </p>
        </div>
    );
}
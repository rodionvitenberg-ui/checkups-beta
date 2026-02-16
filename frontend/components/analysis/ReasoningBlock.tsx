import { BrainCircuit, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

interface ReasoningBlockProps {
    text: string;
}

export function ReasoningBlock({ text }: ReasoningBlockProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl overflow-hidden transition-all">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-indigo-950 text-sm">Клиническое мышление AI</h3>
                        <p className="text-xs text-indigo-600/80">Логика постановки диагноза</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
            </button>
            
            <div className={clsx(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="p-4 pt-0 text-sm text-indigo-900/80 leading-relaxed font-medium border-t border-indigo-100/50">
                    <div className="flex gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                        {text}
                    </div>
                </div>
            </div>
        </div>
    );
}
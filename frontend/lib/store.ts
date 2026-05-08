import { create } from 'zustand';

// Твой старый объект (оставляем как есть, чтобы не сломать FileUploader)
export const sharedFileStore = {
    files: [] as File[]
};

// Наш новый глобальный стейт для приложения
interface AppState {
    isPaywallOpen: boolean;
    setPaywallOpen: (isOpen: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    isPaywallOpen: false,
    setPaywallOpen: (isOpen) => set({ isPaywallOpen: isOpen }),
}));
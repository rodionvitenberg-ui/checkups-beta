'use client';
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

// Тонкая обёртка над sonner с сохранением прежнего API проекта.

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info' | 'loading';
  duration?: number;
  className?: string;
  action?: ToastAction | React.ReactNode;
  cancel?: { label: string; onClick: () => void };
}

export type ToastInput =
  | string
  | (ToastOptions & ({ title: string } | { children?: React.ReactNode }));

type ToastFn = {
  (message: string, options?: ToastOptions): string;
  (options: ToastOptions & { title: string }): string;
  (options: ToastOptions & { children?: React.ReactNode }): string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
};

const toSonnerArgs = (props: { title?: string; description?: string; children?: React.ReactNode; variant?: ToastOptions['variant']; duration?: number }) => {
  const { title, description, children, variant, duration } = props;
  const node = (
    <div>
      {title && <div className="font-semibold text-sm leading-tight">{title}</div>}
      {description && <div className="text-xs opacity-90 leading-relaxed">{description}</div>}
      {children}
    </div>
  );

  const opts: { duration?: number; id?: string } = {};
  if (typeof duration === 'number' && Number.isFinite(duration)) opts.duration = duration;

  switch (variant) {
    case 'destructive':
      return [node, { ...opts, classNames: { toast: '!bg-red-100 !text-red-900 !border-red-200' } }] as const;
    case 'warning':
      return [node, { ...opts, classNames: { toast: '!bg-yellow-100 !text-yellow-900 !border-yellow-200' } }] as const;
    case 'info':
      return [node, { ...opts, classNames: { toast: '!bg-blue-100 !text-blue-900 !border-blue-200' } }] as const;
    case 'loading':
      return [node, { ...opts, duration: Number.isFinite(duration) ? duration : 5000 }] as const;
    case 'success':
      return [node, { ...opts }] as const;
    default:
      return [node, { ...opts }] as const;
  }
};

export const toast: ToastFn = Object.assign(
  (messageOrOptions: ToastInput, options?: ToastOptions): string => {
    const props =
      typeof messageOrOptions === 'string'
        ? { title: messageOrOptions, ...options }
        : (messageOrOptions as ToastOptions & { title?: string; children?: React.ReactNode });

    const toSonnerOpts = (p: ToastOptions & { title?: string; children?: React.ReactNode }) => {
      const opts: Record<string, unknown> = { ...p, id: p.id };
      delete opts.action;
      delete opts.cancel;
      delete opts.variant;
      if (typeof p.duration === 'number' && Number.isFinite(p.duration)) opts.duration = p.duration;
      if (p.action && typeof p.action === 'object' && 'label' in p.action) {
        opts.action = (p.action as ToastAction).label;
        opts.onActionClick = (p.action as ToastAction).onClick;
      }
      if (p.cancel) {
        opts.cancelButtonAriaLabel = p.cancel.label;
      }
      return opts;
    };

    if (props.variant === 'destructive') {
      sonnerToast.error(props.title, toSonnerOpts(props));
    } else if (props.variant === 'warning') {
      sonnerToast.warning(props.title, toSonnerOpts(props));
    } else if (props.variant === 'info') {
      sonnerToast.info(props.title, toSonnerOpts(props));
    } else if (props.variant === 'loading') {
      sonnerToast.loading(props.title, { ...toSonnerOpts(props), duration: Number.isFinite(props.duration) ? props.duration : 5000 });
    } else if (props.variant === 'success') {
      const [, opts] = toSonnerArgs(props);
      sonnerToast.success(props.title, { ...opts });
    } else {
      const [node, opts] = toSonnerArgs(props);
      sonnerToast(node, { ...opts });
    }

    return props.id || '';
  },
  {
    success: (message: string, options?: ToastOptions) => {
      sonnerToast.success(message, options as any);
      return options?.id || '';
    },
    error: (message: string, options?: ToastOptions) => {
      sonnerToast.error(message, options as any);
      return options?.id || '';
    },
    warning: (message: string, options?: ToastOptions) => {
      sonnerToast.warning(message, options as any);
      return options?.id || '';
    },
    info: (message: string, options?: ToastOptions) => {
      sonnerToast.info(message, options as any);
      return options?.id || '';
    },
    loading: (message: string, options?: ToastOptions) => {
      sonnerToast.loading(message, options as any);
      return options?.id || '';
    },
    dismiss: (id?: string) => {
      if (id) sonnerToast.dismiss(id);
      else sonnerToast.dismiss();
    },
  },
) as ToastFn;

export const useToast = () => ({ toast });

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <SonnerToaster richColors position="top-right" />
    </>
  );
};

export default toast;
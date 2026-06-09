import { cn } from '../utils/cn';
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export function Card({ className, children, ...props }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border bg-card shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-4 pb-2', className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-4 pt-0', className)}>{children}</div>;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/20',
    secondary: 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200/50 dark:shadow-amber-900/20',
    ghost: 'hover:bg-muted text-foreground',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
    outline: 'border border-border hover:bg-muted',
  };
  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-xl',
    md: 'h-11 px-5 text-[15px] rounded-xl',
    lg: 'h-13 px-6 text-base rounded-2xl',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-background px-4 text-[15px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition',
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-xl border border-border bg-background px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition min-h-[88px]',
        props.className
      )}
    />
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn('text-sm font-medium text-foreground/90', className)}>{children}</label>;
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' }) {
  const variants = {
    default: 'bg-muted text-foreground',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', variants[variant])}>{children}</span>;
}

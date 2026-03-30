import { forwardRef, ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-lime text-ink hover:bg-lime/90 hover:shadow-lg hover:shadow-lime/20 active:scale-95',
      secondary: 'glass border border-white/10 text-white hover:border-white/20 hover:bg-white/5',
      ghost: 'text-white/70 hover:text-white hover:bg-white/5',
      danger: 'bg-coral text-white hover:bg-coral/90',
    }

    const sizes = {
      sm: 'text-xs px-4 py-2',
      md: 'text-sm px-6 py-3',
      lg: 'text-base px-8 py-4',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button

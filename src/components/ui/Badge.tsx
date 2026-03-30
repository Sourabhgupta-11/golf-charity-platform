import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'lime' | 'coral' | 'slate' | 'muted' | 'gold'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const styles: Record<BadgeVariant, string> = {
  lime: 'bg-lime/15 text-lime border border-lime/25',
  coral: 'bg-coral/15 text-coral border border-coral/25',
  slate: 'bg-white/5 text-white/70 border border-white/10',
  muted: 'bg-white/5 text-white/40 border border-white/5',
  gold: 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/25',
}

export default function Badge({ variant = 'slate', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

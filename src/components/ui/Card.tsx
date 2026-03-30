import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export default function Card({ hover, glow, padding = 'md', className, children, ...props }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
  return (
    <div
      className={clsx(
        'glass rounded-2xl',
        paddings[padding],
        hover && 'card-hover cursor-pointer',
        glow && 'glow-lime-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

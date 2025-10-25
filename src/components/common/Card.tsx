import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  isLoading?: boolean
  className?: string
}

export function Card({ title, children, isLoading = false, className }: CardProps) {
  return (
    <div className={cn(
      'border rounded-lg bg-card text-card-foreground shadow-sm',
      className
    )}>
      {title && (
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}




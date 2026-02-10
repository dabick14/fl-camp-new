import { ReactNode } from 'react'

interface PageLayoutProps {
  title: string
  description?: string
  children: ReactNode
}

/**
 * Standard page layout with header using shadcn/ui design tokens
 */
export function PageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <div className='min-h-screen bg-background'>
      <header className='border-b bg-card'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <h1 className='text-3xl font-bold text-foreground'>{title}</h1>
          {description && (
            <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
          )}
        </div>
      </header>

      <main className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {children}
      </main>
    </div>
  )
}

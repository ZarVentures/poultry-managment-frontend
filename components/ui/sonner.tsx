'use client'

import { useSelector } from 'react-redux'
import type { RootState } from '@/app/redux/store'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const mode = useSelector((state: RootState) => state.theme.mode)

  return (
    <Sonner
      theme={mode as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

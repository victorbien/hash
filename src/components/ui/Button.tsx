type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  as?: 'button' | 'a'
  href?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  as = 'button',
  href,
  type = 'button',
  onClick,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

  const styles = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-[#f9dfe1] text-primary hover:bg-[#f5cfd3]',
    ghost: 'border border-primary bg-transparent text-primary hover:bg-[#fff1f2]',
  }

  const classes = `${base} ${styles[variant]} ${className}`

  if (as === 'a') {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  )
}

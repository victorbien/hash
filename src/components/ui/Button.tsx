import { Link } from 'react-router-dom'

type ButtonBaseProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  className?: string
}

type ButtonProps = ButtonBaseProps & (
  | { as: 'link'; to: string }
  | { as: 'a'; href: string }
  | { as?: 'button'; type?: 'button' | 'submit' | 'reset'; onClick?: () => void; disabled?: boolean }
)

export function Button(props: ButtonProps) {
  const { children, variant = 'primary', className = '' } = props
  const base =
    'action-button inline-flex cursor-pointer items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
  const styles = {
    primary: 'bg-primary text-white hover:bg-[var(--primary-strong)]',
    secondary: 'bg-[#f9dfe1] text-primary hover:bg-[#f1cbd0]',
    ghost: 'border border-primary bg-transparent text-primary hover:bg-[#fff1f2]',
    outline: 'public-outline-link',
  }
  const classes = `${base} ${styles[variant]} ${className}`

  if (props.as === 'link') return <Link to={props.to} className={classes}>{children}</Link>
  if (props.as === 'a') return <a href={props.href} className={classes}>{children}</a>

  return (
    <button type={props.type ?? 'button'} className={classes} onClick={props.onClick} disabled={props.disabled}>
      {children}
    </button>
  )
}

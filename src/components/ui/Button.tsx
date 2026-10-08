import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode };

const variantClass: Record<ButtonVariant, string> = {
  primary: 'button button-red',
  secondary: 'button button-plain',
  outline: 'button outline-button',
  text: 'text-link',
};

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return <button className={`${variantClass[variant]} ${className}`.trim()} {...props}>{children}</button>;
}

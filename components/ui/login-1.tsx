'use client'

import * as React from 'react'
import { useState, forwardRef } from 'react'
import Image from 'next/image'
import { useAppSettings } from '@/lib/app-settings-context'

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, placeholder, icon, error, ...rest }, ref) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    const handleMouseMove = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    return (
      <div className="w-full relative">
        {label && (
          <label className="block mb-2 text-sm text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            className="peer relative z-10 border-2 border-[var(--color-border)] h-12 w-full rounded-md bg-[var(--color-surface)] px-4 font-thin text-[var(--color-text-primary)] outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[var(--color-bg)] placeholder:font-medium placeholder:text-[var(--color-text-secondary)]"
            placeholder={placeholder}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            {...rest}
          />
          {isHovering && (
            <>
              <div
                className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-md overflow-hidden"
                style={{
                  background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
                }}
              />
              <div
                className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-md overflow-hidden"
                style={{
                  background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
                }}
              />
            </>
          )}
          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)]">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    )
  }
)

AppInput.displayName = 'AppInput'

interface LoginCardProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isSubmitting?: boolean
  error?: string
  children?: React.ReactNode
  emailField: React.ReactNode
  passwordField: React.ReactNode
}

const LoginCard = ({
  onSubmit,
  isSubmitting,
  error,
  emailField,
  passwordField,
  children,
}: LoginCardProps) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const { shopName, logoUrl } = useAppSettings()

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div className="h-screen w-full bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="card w-full max-w-3xl flex justify-between h-[600px]">
        {/* Left: Form */}
        <div
          className="w-full lg:w-1/2 px-8 lg:px-14 h-full relative overflow-hidden flex flex-col justify-center"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Glow effect */}
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-purple-300/20 via-blue-300/20 to-pink-300/20 rounded-full blur-3xl transition-opacity duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          />

          <form className="relative z-10 grid gap-6" onSubmit={onSubmit}>
            {/* Header */}
            <div className="text-center grid gap-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-2 overflow-hidden">
                {logoUrl ? (
                  <Image src={logoUrl} alt={shopName} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-[var(--color-heading)]">
                {shopName}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Σύστημα Παρακολούθησης Επισκευών
              </p>
            </div>

            {/* Fields */}
            <div className="grid gap-4">
              {emailField}
              {passwordField}
            </div>

            {/* Extra slot (remember me, etc.) */}
            {children}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/button relative w-full inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Σύνδεση...' : 'Σύνδεση'}
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/10" />
              </div>
            </button>
          </form>
        </div>

        {/* Right: Image */}
        <div className="hidden lg:block w-1/2 h-full overflow-hidden relative">
          <Image
            src="https://images.pexels.com/photos/7102037/pexels-photo-7102037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            fill
            priority
            alt="RepairTrack"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[var(--color-surface)]/60" />
        </div>
      </div>
    </div>
  )
}

export { AppInput, LoginCard }

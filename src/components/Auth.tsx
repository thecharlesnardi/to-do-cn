import { useState } from 'react'
import type { FormEvent } from 'react'
import { EnvelopeSimple, Lock, Eye, EyeSlash, SpinnerGap, CheckCircle } from '@phosphor-icons/react'

interface AuthProps {
  onSignIn: (email: string, password: string) => Promise<unknown>
  onSignUp: (email: string, password: string) => Promise<unknown>
  onResetPassword: (email: string) => Promise<void>
  isDark: boolean
}

type AuthMode = 'signin' | 'signup' | 'reset'

/**
 * Authentication component with login, signup, and password reset
 * Matches the app's glass-morphism design style
 */
export function Auth({ onSignIn, onSignUp, onResetPassword, isDark }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        await onSignIn(email, password)
      } else if (mode === 'signup') {
        await onSignUp(email, password)
        setSuccessMessage('Check your email to confirm your account!')
      } else if (mode === 'reset') {
        await onResetPassword(email)
        setSuccessMessage('Password reset email sent!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-void-950' : 'bg-void-50'}`}>
      <div
        className={`
          w-full max-w-sm rounded-2xl p-8
          ${isDark
            ? 'bg-void-800/80 border border-void-700 backdrop-blur-sm'
            : 'bg-white/80 border border-void-200 backdrop-blur-sm'
          }
          shadow-2xl
        `}
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-void-50' : 'text-void-900'}`}>
            Todo App
          </h1>
          <p className={`text-sm ${isDark ? 'text-void-400' : 'text-void-500'}`}>
            {mode === 'signin' && 'Welcome back! Sign in to continue.'}
            {mode === 'signup' && 'Create an account to get started.'}
            {mode === 'reset' && 'Enter your email to reset password.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`
            mb-4 p-3 rounded-lg text-sm
            ${isDark ? 'bg-danger/20 text-red-400' : 'bg-danger/10 text-danger'}
          `}>
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className={`
            mb-4 p-3 rounded-lg text-sm flex items-center gap-2
            ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}
          `}>
            <CheckCircle size={18} weight="fill" />
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <EnvelopeSimple
              size={20}
              className={`
                absolute left-3 top-1/2 -translate-y-1/2
                ${isDark ? 'text-void-500' : 'text-void-400'}
              `}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className={`
                w-full pl-10 pr-4 py-3 rounded-lg
                text-base outline-none
                transition-all duration-200
                ${isDark
                  ? 'bg-void-700 border border-void-600 text-void-100 placeholder:text-void-500 focus:border-anthropic-blue'
                  : 'bg-void-50 border border-void-200 text-void-900 placeholder:text-void-400 focus:border-anthropic-blue'
                }
              `}
            />
          </div>

          {/* Password Input (not shown for reset) */}
          {mode !== 'reset' && (
            <div className="relative">
              <Lock
                size={20}
                className={`
                  absolute left-3 top-1/2 -translate-y-1/2
                  ${isDark ? 'text-void-500' : 'text-void-400'}
                `}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className={`
                  w-full pl-10 pr-12 py-3 rounded-lg
                  text-base outline-none
                  transition-all duration-200
                  ${isDark
                    ? 'bg-void-700 border border-void-600 text-void-100 placeholder:text-void-500 focus:border-anthropic-blue'
                    : 'bg-void-50 border border-void-200 text-void-900 placeholder:text-void-400 focus:border-anthropic-blue'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`
                  absolute right-3 top-1/2 -translate-y-1/2
                  p-1 rounded cursor-pointer
                  ${isDark ? 'text-void-500 hover:text-void-300' : 'text-void-400 hover:text-void-600'}
                `}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-lg
              font-medium text-base
              transition-all duration-200
              cursor-pointer disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              ${isDark
                ? 'bg-ember-500 text-void-950 hover:bg-ember-400 disabled:bg-ember-500/50'
                : 'bg-ember-600 text-white hover:bg-ember-500 disabled:bg-ember-600/50'
              }
            `}
          >
            {loading && <SpinnerGap size={20} className="animate-spin" />}
            {mode === 'signin' && (loading ? 'Signing in...' : 'Sign In')}
            {mode === 'signup' && (loading ? 'Creating account...' : 'Create Account')}
            {mode === 'reset' && (loading ? 'Sending...' : 'Send Reset Email')}
          </button>
        </form>

        {/* Mode Switchers */}
        <div className="mt-6 space-y-2 text-center">
          {mode === 'signin' && (
            <>
              <button
                onClick={() => switchMode('reset')}
                className={`
                  text-sm cursor-pointer
                  ${isDark ? 'text-void-400 hover:text-void-200' : 'text-void-500 hover:text-void-700'}
                `}
              >
                Forgot password?
              </button>
              <p className={`text-sm ${isDark ? 'text-void-500' : 'text-void-400'}`}>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className={`font-medium cursor-pointer ${isDark ? 'text-ember-400 hover:text-ember-300' : 'text-ember-600 hover:text-ember-500'}`}
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p className={`text-sm ${isDark ? 'text-void-500' : 'text-void-400'}`}>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('signin')}
                className={`font-medium cursor-pointer ${isDark ? 'text-ember-400 hover:text-ember-300' : 'text-ember-600 hover:text-ember-500'}`}
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => switchMode('signin')}
              className={`
                text-sm cursor-pointer
                ${isDark ? 'text-void-400 hover:text-void-200' : 'text-void-500 hover:text-void-700'}
              `}
            >
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

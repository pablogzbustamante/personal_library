import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await client.post('/api/auth/register', { email, username, password })
      }
      const form = new FormData()
      form.append('username', email)
      form.append('password', password)
      const { data } = await client.post('/api/auth/login', form)
      localStorage.setItem('folio_token', data.access_token)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div
        className="rounded-2xl p-8 flex flex-col gap-5"
        style={{ width: '100%', maxWidth: 360, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-1">
          <span className="text-2xl font-bold tracking-tight text-[#534AB7]">MoonLibrary</span>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Bienvenida de vuelta' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <input
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors"
              style={inputStyle}
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          )}
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors"
            style={inputStyle}
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors"
            style={inputStyle}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-2 rounded-lg text-sm font-medium text-white bg-[#534AB7] hover:bg-[#4540a0] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            className="text-[#534AB7] font-medium hover:underline"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

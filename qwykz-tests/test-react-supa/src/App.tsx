import { useState, useEffect } from 'react'
import { z } from 'zod'
import { supabase } from './lib/supabase'
import { AuthProvider, useAuth } from './lib/AuthContext'

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setServerError(null)
    setSuccessMessage(null)
    
    try {
      const parsed = authSchema.parse({ email, password })
      
      const { data, error: err } = mode === 'login' 
        ? await supabase.auth.signInWithPassword({ email: parsed.email, password: parsed.password })
        : await supabase.auth.signUp({ email: parsed.email, password: parsed.password })
        
      if (err) {
        if (err.status === 429) {
          setServerError("Too many requests! You are being rate limited. Please wait a moment and try again.")
        } else {
          setServerError(err.message)
        }
      } else if (mode === 'register' && data?.user && !data?.session) {
        setSuccessMessage("Success! Please check your email to verify your account.")
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        err.errors.forEach(e => {
          if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {serverError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="text-sm text-red-700">{serverError}</div>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="text-sm text-green-700">{successMessage}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {mode === 'login' ? 'Create a new account instead' : 'Log in to existing account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { user, session, signOut } = useAuth()
  const [backendStatus, setBackendStatus] = useState<string>("Testing connection...")
  
  useEffect(() => {
    async function testBackend() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}api/health`)
        if (res.ok) {
          const authRes = await fetch(`${import.meta.env.VITE_API_URL}api/users`, {
            headers: { Authorization: `Bearer ${session?.access_token}` }
          })
          if (authRes.status === 403) {
            setBackendStatus("Connected! (Users API blocked: Requires ADMIN role)")
          } else if (authRes.ok) {
            setBackendStatus("Connected! (Users API authenticated)")
          } else {
            setBackendStatus("Connected to backend, but auth failed.")
          }
        } else {
          setBackendStatus("Failed to connect to backend.")
        }
      } catch (err) {
        setBackendStatus("Backend is unreachable. Is it running?")
      }
    }
    testBackend()
  }, [session])
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button 
                onClick={signOut}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center bg-white space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Welcome back!</h2>
            <p className="text-gray-600">You are securely authenticated as <span className="font-bold">{user?.email}</span></p>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200 w-full max-w-md">
              <h3 className="font-medium text-gray-900 mb-2">Backend Connection Status:</h3>
              <p className={`text-sm ${backendStatus.includes('Connected') ? 'text-green-600' : 'text-red-600'}`}>
                {backendStatus}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function AppContent() {
  const { session } = useAuth()
  return session ? <Dashboard /> : <AuthForm />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

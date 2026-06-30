import { useState, useEffect } from "react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  
  const [backendStatus, setBackendStatus] = useState("Checking backend connection...");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      testBackend();
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const testBackend = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}api/health`);
      if (res.ok) {
        const authRes = await fetch(`${import.meta.env.VITE_API_URL}api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (authRes.status === 403) {
          setBackendStatus("Connected to backend (Users API blocked: Requires ADMIN role)");
        } else if (authRes.ok) {
          setBackendStatus("Connected to backend! (Users API authenticated)");
          const data = await authRes.json();
          setUsers(data);
        } else {
          setBackendStatus(`Connected to backend (Users API Error: ${authRes.status})`);
        }
      } else {
        setBackendStatus("Backend health check failed.");
      }
    } catch (e) {
      setBackendStatus("Cannot connect to backend. Is it running?");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "login" : "register";
    const body = isLogin ? { email, password } : { email, password, name };
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Authentication failed");
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline font-medium">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500">Welcome to your local custom auth boilerplate.</p>
          </div>
          <button onClick={() => setToken(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
            Sign Out
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Backend Connection Status</h2>
          <div className={`p-4 rounded-xl border ${backendStatus.includes('!') ? 'bg-green-50 border-green-200 text-green-700' : backendStatus.includes('failed') || backendStatus.includes('Cannot') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${backendStatus.includes('!') ? 'bg-green-500' : backendStatus.includes('failed') || backendStatus.includes('Cannot') ? 'bg-red-500' : 'bg-blue-500'} animate-pulse`}></div>
              <p className="font-medium">{backendStatus}</p>
            </div>
          </div>
        </div>

        {users.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Users API Response</h2>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
              {JSON.stringify(users, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

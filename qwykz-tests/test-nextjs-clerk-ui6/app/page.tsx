"use client";

import { useEffect, useState } from "react";
import { SignIn, SignUp, UserButton, useAuth } from "@clerk/nextjs";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [backendStatus, setBackendStatus] = useState<string>("Testing connection...");
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    async function testBackend() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const token = await getToken();
          if (!token) {
            setBackendStatus("Connected to Next.js API (Waiting for login to test auth)");
            return;
          }
          // Assuming you have an /api/users route in Next.js to test auth
          setBackendStatus("Connected! (Authentication token ready)");
        } else {
          setBackendStatus("Failed to connect to Next.js API.");
        }
      } catch (err) {
        setBackendStatus("Next.js API is unreachable.");
      }
    }
    testBackend();
  }, [getToken]);

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center">
                <UserButton />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center bg-white space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">Welcome back!</h2>
              <p className="text-gray-600">You are securely authenticated with Clerk.</p>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200 w-full max-w-md text-center">
                <h3 className="font-medium text-gray-900 mb-2">API Connection Status:</h3>
                <p className={`text-sm ${backendStatus.includes('Connected') ? 'text-green-600' : 'text-red-600'}`}>
                  {backendStatus}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {isLogin ? <SignIn routing="hash" /> : <SignUp routing="hash" />}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-blue-600 hover:underline"
        >
          {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}

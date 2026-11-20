"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (searchParams.get('tab') === 'signup') {
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Simulate login/signup and redirect to dashboard
    setTimeout(() => {
      localStorage.setItem('techeru_user', JSON.stringify({
        name: isLogin ? 'Student' : 'New Scholar',
        email: 'student@gmail.com',
        avatar: 'https://ui-avatars.com/api/?name=S&background=3b82f6&color=fff',
      }));
      router.push('/');
    }, 1200);
  };

  const handleGuestAuth = () => {
    localStorage.setItem('techeru_user', JSON.stringify({
      name: 'Guest',
      email: '',
      avatar: '',
    }));
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo_cat.png" alt="Techeru Logo" className="w-20 h-20 object-contain drop-shadow-xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Techeru SI Lecture</h1>
          <p className="text-gray-400 mt-2">Your personal AI lecture companion 🐱</p>
        </div>

        {/* Card */}
        <div className="bg-[#121624] border border-white/10 rounded-2xl p-8 shadow-2xl">
          
          {/* Tabs */}
          <div className="flex bg-black/40 rounded-lg p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${isLogin ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${!isLogin ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            {isLogin ? 'Welcome back! 👋' : 'Create an account 🚀'}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {isLogin ? 'Sign in to access your notebooks and continue learning.' : 'Sign up to create notebooks and get a personalized AI tutor.'}
          </p>

          {/* Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            handleGoogleAuth(); // Reusing the mock auth handler for prototype
          }} className="space-y-4 mb-6">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="you@example.com" 
                className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 shadow-lg shadow-blue-600/20 disabled:opacity-70 mt-2"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Auth */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-xl transition duration-200 mb-4 disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>



          <button
            onClick={handleGuestAuth}
            className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 border border-white/20 text-gray-300 font-medium py-3.5 px-6 rounded-xl transition"
          >
            Continue as Guest
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          By {isLogin ? 'logging in' : 'creating an account'}, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0c14]" />}>
      <LoginContent />
    </Suspense>
  );
}

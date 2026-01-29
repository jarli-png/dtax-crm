'use client';

import { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Vennligst fyll inn e-post og passord');
        setIsLoading(false);
        return;
      }

      const errorMsg = await onLogin(email, password);
      if (errorMsg) {
        setError(errorMsg);
      }
    } catch (err) {
      setError('Innlogging feilet. Prøv igjen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dtax-dark to-dtax-secondary">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-dtax-accent">d</span>Tax CRM
          </h1>
          <p className="text-gray-400 mt-2">Kundestøtte & Salgssystem</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Logg inn</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">
                E-post
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="din@epost.no"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Passord
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-dtax-primary focus:ring-dtax-primary" />
                <span className="ml-2 text-sm text-gray-600">Husk meg</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logger inn...
                </span>
              ) : (
                'Logg inn'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            © 2026 dTax - Internt system
          </p>
        </div>
      </div>
    </div>
  );
}

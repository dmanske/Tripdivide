import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Card } from './CommonUI';

interface AuthProps {
  onSuccess: () => void;
  initialMode?: 'signup' | 'login';
}

const Auth: React.FC<AuthProps> = ({ onSuccess, initialMode = 'login' }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Verifique seu email para confirmar o cadastro!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (error: any) {
      setMessage(error.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="TripDivide" 
            className="h-24 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Crie sua conta para começar' : 'Entre para acessar suas viagens'}
          </p>
        </div>

        <Card className="!bg-gray-900/50 !border-white/10">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm ${
                message.includes('Erro') || message.includes('erro')
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>
                {message}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full !py-3 !text-lg font-black uppercase"
            >
              {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
              }}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-6">
          Ao criar uma conta, você concorda com nossos termos de uso
        </p>
      </div>
    </div>
  );
};

export default Auth;

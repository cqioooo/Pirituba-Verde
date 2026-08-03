import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button, Input, Alert } from '@/components/ui';
import { validateEmail, validatePassword } from '../validators';
import { Envelope, Lock } from '@phosphor-icons/react';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

export function LoginForm() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(!isSupabaseConfigured ? 'maria@email.com' : '');
  const [password, setPassword] = useState(!isSupabaseConfigured ? '123456' : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'E-mail ou senha incorretos. Verifique seus dados.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-surface-900">Entrar</h1>
        <p className="text-sm text-surface-500">
          Acesse sua conta para acompanhar o mapa detalhado e denúncias.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="bg-primary-50 text-primary-800 text-xs p-3 rounded-lg border border-primary-200 text-center">
          <p className="font-semibold">Modo de Teste / Mock Ativo</p>
          <p className="mt-0.5 opacity-90">Supabase não configurado. Use as credenciais pré-preenchidas para testar.</p>
        </div>
      )}

      {submitError && (
        <Alert variant="error">{submitError}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          icon={<Envelope className="w-4 h-4" />}
          required
          autoComplete="email"
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          icon={<Lock className="w-4 h-4" />}
          required
          autoComplete="current-password"
        />

        <Button type="submit" fullWidth loading={loading} size="lg">
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-surface-500">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
          Cadastre-se gratuitamente
        </Link>
      </p>
    </div>
  );
}

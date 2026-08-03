import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button, Input, Alert } from '@/components/ui';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateFullName,
  validateCPF,
  validatePhone,
  validateDateOfBirth,
  validateNeighborhood,
  validateStreet,
} from '../validators';
import { formatCPF, formatPhone, formatDate } from '@/lib/utils';
import { Shield } from '@phosphor-icons/react';

interface FormData {
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  neighborhood: string;
  street: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

const initialFormData: FormData = {
  fullName: '',
  cpf: '',
  dateOfBirth: '',
  neighborhood: '',
  street: '',
  phone: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

export function RegisterForm() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    const checks: [string, string | null][] = [
      ['fullName', validateFullName(formData.fullName)],
      ['cpf', formData.cpf ? validateCPF(formData.cpf) : null],
      ['dateOfBirth', validateDateOfBirth(formData.dateOfBirth)],
      ['neighborhood', validateNeighborhood(formData.neighborhood)],
      ['street', validateStreet(formData.street)],
      ['phone', validatePhone(formData.phone)],
      ['email', validateEmail(formData.email)],
      ['password', validatePassword(formData.password)],
      ['passwordConfirmation', validatePasswordConfirmation(formData.password, formData.passwordConfirmation)],
    ];

    for (const [field, error] of checks) {
      if (error) newErrors[field] = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        cpf: formData.cpf.replace(/\D/g, ''),
        dateOfBirth: formData.dateOfBirth,
        neighborhood: formData.neighborhood,
        street: formData.street,
        phone: formData.phone.replace(/\D/g, ''),
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível criar a conta. Verifique os dados ou tente novamente.');
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-success-50 flex items-center justify-center">
          <Shield className="w-8 h-8 text-success-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-surface-900">Conta criada!</h1>
          <p className="text-sm text-surface-500">
            Enviamos um e-mail de confirmação. Verifique sua caixa de entrada
            (e a pasta de spam) para ativar sua conta.
          </p>
        </div>
        <Button onClick={() => navigate('/login')} fullWidth>
          Ir para o login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-surface-900">Criar conta</h1>
        <p className="text-sm text-surface-500">
          Cadastre-se para acessar o mapa detalhado, registrar denúncias
          e acompanhar o histórico de pontos de descarte irregular.
        </p>
      </div>

      {submitError && (
        <Alert variant="error">{submitError}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Dados pessoais */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-surface-700 mb-2">
            Dados pessoais
          </legend>

          <Input
            label="Nome completo"
            placeholder="Maria Silva Santos"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            error={errors.fullName}
            required
            autoComplete="name"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="CPF (Opcional)"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => updateField('cpf', formatCPF(e.target.value))}
              error={errors.cpf}
              hint="Necessário se quiser validar sua identidade na moderação."
              inputMode="numeric"
            />
            <Input
              label="Data de nascimento"
              placeholder="DD/MM/AAAA"
              value={formData.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', formatDate(e.target.value))}
              error={errors.dateOfBirth}
              required
              inputMode="numeric"
            />
          </div>
        </fieldset>

        {/* Endereço */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-surface-700 mb-2">
            Endereço
          </legend>

          <Input
            label="Bairro"
            placeholder="Ex: Pirituba"
            value={formData.neighborhood}
            onChange={(e) => updateField('neighborhood', e.target.value)}
            error={errors.neighborhood}
            required
          />

          <Input
            label="Rua"
            placeholder="Apenas o nome da rua, ex: Rua Paula Ferreira"
            value={formData.street}
            onChange={(e) => updateField('street', e.target.value)}
            error={errors.street}
            required
            hint="Não inclua o número da residência por privacidade."
          />

          <Input
            label="Celular"
            placeholder="(11) 91234-5678"
            value={formData.phone}
            onChange={(e) => updateField('phone', formatPhone(e.target.value))}
            error={errors.phone}
            hint="Para contato sobre suas denúncias, se necessário."
            required
            inputMode="tel"
          />
        </fieldset>

        {/* Acesso */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-surface-700 mb-2">
            Acesso
          </legend>

          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
          />

          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={errors.password}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirmar senha"
            type="password"
            placeholder="Repita sua senha"
            value={formData.passwordConfirmation}
            onChange={(e) => updateField('passwordConfirmation', e.target.value)}
            error={errors.passwordConfirmation}
            required
            autoComplete="new-password"
          />
        </fieldset>

        {/* Info de privacidade */}
        <div className="flex gap-2 p-3 bg-primary-50 rounded-lg">
          <Shield className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-xs text-primary-800 leading-relaxed">
            Seus dados são protegidos e utilizados apenas para validação
            de identidade e comunicação sobre denúncias. Não compartilhamos
            informações com terceiros.
          </p>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">
          Criar minha conta
        </Button>
      </form>

      <p className="text-center text-sm text-surface-500">
        Já tem conta?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
          Faça login
        </Link>
      </p>
    </div>
  );
}

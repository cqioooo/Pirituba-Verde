
/**
 * Validadores de formulário com mensagens em português, claras e humanas.
 */

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Informe seu e-mail.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'O e-mail informado não parece válido.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Informe uma senha.';
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Confirme sua senha.';
  if (password !== confirmation) return 'As senhas não coincidem.';
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name.trim()) return 'Informe seu nome completo.';
  if (name.trim().split(/\s+/).length < 2) return 'Informe nome e sobrenome.';
  return null;
}

export function validateCPF(cpf: string): string | null {
  const digits = cpf.replace(/\D/g, '');
  if (!digits) return 'Informe seu CPF.';
  if (digits.length !== 11) return 'O CPF deve ter 11 dígitos.';

  // Verificar sequência repetida
  if (/^(\d)\1{10}$/.test(digits)) return 'CPF inválido.';

  // Validação algoritmo
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits.charAt(9))) return 'CPF inválido.';

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits.charAt(10))) return 'CPF inválido.';

  return null;
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return 'Informe seu celular.';
  if (digits.length < 10 || digits.length > 11) {
    return 'O número deve ter 10 ou 11 dígitos (com DDD).';
  }
  return null;
}

export function validateDateOfBirth(date: string): string | null {
  if (!date.trim()) return 'Informe sua data de nascimento.';
  const parts = date.split('/');
  if (parts.length !== 3) return 'Use o formato DD/MM/AAAA.';

  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return 'Data inválida.';
  if (year < 1900 || year > new Date().getFullYear() - 10) return 'Ano de nascimento inválido.';
  if (month < 1 || month > 12) return 'Mês inválido.';
  if (day < 1 || day > 31) return 'Dia inválido.';

  return null;
}

export function validateNeighborhood(neighborhood: string): string | null {
  if (!neighborhood.trim()) return 'Informe seu bairro.';
  return null;
}

export function validateStreet(street: string): string | null {
  if (!street.trim()) return 'Informe sua rua.';
  return null;
}

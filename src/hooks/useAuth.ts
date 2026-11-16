import { useContext } from 'react';
import { AuthContext } from '@/providers/authContext';
import type { AuthContextType } from '@/types';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

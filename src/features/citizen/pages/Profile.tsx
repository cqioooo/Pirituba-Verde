import { useAuth } from '@/providers/AuthProvider';
import { usePerfilUsuario } from '@/services/queries';
import { Card, Spinner } from '@/components/ui';
import { UserCircle, Mail, MapPin, Phone, Calendar } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const { data: perfil, isLoading } = usePerfilUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const fields = [
    { icon: UserCircle, label: 'Nome', value: perfil?.nome || user?.user_metadata?.full_name },
    { icon: Mail, label: 'E-mail', value: user?.email },
    { icon: MapPin, label: 'Bairro', value: perfil?.bairro_residencia || user?.user_metadata?.bairro_residencia },
    { icon: MapPin, label: 'Rua', value: perfil?.rua || user?.user_metadata?.rua },
    { icon: Phone, label: 'Celular', value: perfil?.telefone || user?.user_metadata?.telefone },
    { icon: Calendar, label: 'Nascimento', value: perfil?.data_nascimento || user?.user_metadata?.data_nascimento },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Meu perfil</h1>
        <p className="text-sm text-surface-500 mt-1">
          Seus dados cadastrais na plataforma.
        </p>
      </div>

      <Card>
        {/* Avatar e nome */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-100">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {perfil?.avatar_url ? (
               <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <UserCircle className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-surface-900">
              {perfil?.nome || user?.user_metadata?.full_name || 'Cidadão'}
            </p>
            <p className="text-sm text-surface-500">{user?.email}</p>
          </div>
        </div>

        {/* Dados */}
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center gap-3">
              <field.icon className="w-4 h-4 text-surface-400 shrink-0" />
              <div>
                <p className="text-xs text-surface-400 uppercase tracking-wide">
                  {field.label}
                </p>
                <p className="text-sm text-surface-800">
                  {field.value || '—'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 pt-4 border-t border-surface-100 text-xs text-surface-400">
          A edição de perfil estará disponível em breve.
        </p>
      </Card>
    </div>
  );
}

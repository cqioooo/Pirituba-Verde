import { useAuth } from '@/providers/AuthProvider';
import { usePerfilUsuario } from '@/services/queries';
import { Spinner } from '@/components/ui';
import { UserCircle, Envelope, MapPin, Phone, Info } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function Profile() {
  const { user } = useAuth();
  const { data: perfil, isLoading } = usePerfilUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 min-h-[50vh] items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const contatoFields = [
    { icon: Envelope, label: 'E-mail', value: user?.email },
    { icon: Phone, label: 'Celular', value: perfil?.telefone || user?.user_metadata?.telefone },
  ];

  const enderecoFields = [
    { icon: MapPin, label: 'Bairro', value: perfil?.bairro_residencia || user?.user_metadata?.bairro_residencia },
    { icon: MapPin, label: 'Rua', value: perfil?.rua || user?.user_metadata?.rua },
  ];

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show"
      className="space-y-6 pb-20 pt-4 max-w-3xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">Meu perfil</h1>
        <p className="text-sm sm:text-base text-surface-500 mt-1">
          Gerencie seus dados e informações na plataforma.
        </p>
      </motion.div>

      {/* Hero Card */}
      <motion.div variants={itemVariants} className="p-6 bg-white rounded-[32px] border border-surface-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-primary-200">
          {perfil?.avatar_url ? (
             <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
             <UserCircle className="w-10 h-10 text-primary-600" weight="fill" />
          )}
        </div>
        <div className="flex-1 space-y-1 mt-1 sm:mt-2">
          <p className="text-xl font-bold text-surface-900 tracking-tight">
            {perfil?.nome || user?.user_metadata?.full_name || 'Cidadão'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 text-surface-600 text-xs font-semibold uppercase tracking-wider">
            <UserCircle className="w-3.5 h-3.5" weight="bold" />
            Membro da comunidade
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Contato */}
        <motion.div variants={itemVariants} className="p-6 bg-white rounded-[24px] border border-surface-200 shadow-sm">
          <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wider mb-5">Contato</h2>
          <div className="space-y-4">
            {contatoFields.map((field) => (
              <div key={field.label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-50 flex items-center justify-center shrink-0">
                  <field.icon className="w-5 h-5 text-surface-500" weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-surface-400 uppercase tracking-wider">
                    {field.label}
                  </p>
                  <p className="text-sm font-medium text-surface-800">
                    {field.value || 'Não informado'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card Endereço */}
        <motion.div variants={itemVariants} className="p-6 bg-white rounded-[24px] border border-surface-200 shadow-sm">
          <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wider mb-5">Endereço</h2>
          <div className="space-y-4">
            {enderecoFields.map((field) => (
              <div key={field.label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-50 flex items-center justify-center shrink-0">
                  <field.icon className="w-5 h-5 text-surface-500" weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-surface-400 uppercase tracking-wider">
                    {field.label}
                  </p>
                  <p className="text-sm font-medium text-surface-800">
                    {field.value || 'Não informado'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="p-4 bg-surface-50 rounded-2xl border border-surface-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-surface-500 shrink-0 mt-0.5" weight="fill" />
        <p className="text-sm text-surface-600 leading-relaxed">
          A edição completa de perfil estará disponível em breve. Por enquanto, as informações exibidas são as fornecidas durante o seu cadastro.
        </p>
      </motion.div>

    </motion.div>
  );
}

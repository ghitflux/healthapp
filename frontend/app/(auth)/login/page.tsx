import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/login-form';
import { AuthTemplate } from '@/components/templates/auth-template';

export const metadata: Metadata = {
  title: 'Login — Abase Saúde',
};

export default function LoginPage() {
  return (
    <AuthTemplate
      title="Bem-vindo de volta"
      subtitle="Entre com suas credenciais para acessar o painel"
    >
      <LoginForm />
    </AuthTemplate>
  );
}

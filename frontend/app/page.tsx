import { redirect } from 'next/navigation';

/**
 * Root page — redireciona para login.
 * O middleware cuida do redirect baseado no role se autenticado.
 */
export default function RootPage() {
  redirect('/login');
}

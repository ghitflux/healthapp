import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const metadata: Metadata = {
  title: 'Recuperar Senha — Abase Saúde',
};

export default function ForgotPasswordPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Informe seu e-mail para receber as instruções de recuperação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input type="email" id="email" placeholder="seu@email.com" />
        </div>
        <Button className="w-full">Enviar instruções</Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary-600 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

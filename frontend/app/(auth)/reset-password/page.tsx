import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const metadata: Metadata = {
  title: 'Redefinir Senha — HealthApp',
};

export default function ResetPasswordPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
        <CardDescription>
          Crie uma nova senha para sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input type="password" id="password" placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input type="password" id="confirm" placeholder="••••••••" />
        </div>
        <Button className="w-full">Redefinir senha</Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary-600 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

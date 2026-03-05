'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod/v4';
import type { Convenio } from '@api/types/Convenio';
import type { PatchedConvenioRequest } from '@api/types/PatchedConvenioRequest';
import { patchedConvenioRequestSchema } from '@api/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoaderIcon, SaveIcon } from '@/lib/icons';

type BaseFormValues = z.infer<typeof patchedConvenioRequestSchema>;

type ConvenioInfoFormValues = Omit<BaseFormValues, 'address'> & {
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    lat?: string;
    lng?: string;
  };
};

interface ConvenioInfoFormProps {
  convenio: Convenio;
  onSubmit: (data: PatchedConvenioRequest) => Promise<void>;
  isSubmitting: boolean;
}

function buildAddress(address: Convenio['address']) {
  return {
    street: typeof address?.street === 'string' ? address.street : '',
    city: typeof address?.city === 'string' ? address.city : '',
    state: typeof address?.state === 'string' ? address.state : '',
    zip: typeof address?.zip === 'string' ? address.zip : '',
    lat: typeof address?.lat === 'string' ? address.lat : '',
    lng: typeof address?.lng === 'string' ? address.lng : '',
  };
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== '' && entry !== undefined && entry !== null)
  );
}

export function ConvenioInfoForm({
  convenio,
  onSubmit,
  isSubmitting,
}: ConvenioInfoFormProps) {
  const form = useForm<ConvenioInfoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(patchedConvenioRequestSchema as any),
    defaultValues: {
      name: convenio.name,
      cnpj: convenio.cnpj,
      contact_email: convenio.contact_email,
      contact_phone: convenio.contact_phone,
      description: convenio.description ?? '',
      address: buildAddress(convenio.address),
    },
  });

  useEffect(() => {
    form.reset({
      name: convenio.name,
      cnpj: convenio.cnpj,
      contact_email: convenio.contact_email,
      contact_phone: convenio.contact_phone,
      description: convenio.description ?? '',
      address: buildAddress(convenio.address),
    });
  }, [convenio, form]);

  async function handleSubmit(values: ConvenioInfoFormValues) {
    await onSubmit({
      name: values.name?.trim(),
      contact_email: values.contact_email?.trim() || undefined,
      contact_phone: values.contact_phone?.trim() || undefined,
      description: values.description?.trim() || undefined,
      address: compactObject(values.address),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informacoes do convenio</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do convenio</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de contato</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone de contato</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="mr-2 h-4 w-4" />
                )}
                Salvar alteracoes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

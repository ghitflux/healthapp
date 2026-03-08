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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoaderIcon, SaveIcon } from '@/lib/icons';
import { maskCnpjInput, maskPhoneInput, maskZipCodeInput } from '@/lib/input-masks';
import { BRAZILIAN_STATE_OPTIONS } from './convenio-settings';

type BaseFormValues = z.infer<typeof patchedConvenioRequestSchema>;

type ConvenioInfoFormValues = Omit<BaseFormValues, 'address'> & {
  address: {
    street?: string;
    number?: string;
    neighborhood?: string;
    complement?: string;
    reference?: string;
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
    number:
      typeof address?.number === 'string' || typeof address?.number === 'number'
        ? String(address.number)
        : '',
    neighborhood: typeof address?.neighborhood === 'string' ? address.neighborhood : '',
    complement: typeof address?.complement === 'string' ? address.complement : '',
    reference: typeof address?.reference === 'string' ? address.reference : '',
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
        <CardTitle className="text-base">Informações da clínica</CardTitle>
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
                    <FormLabel>Nome da clínica</FormLabel>
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
                      <Input {...field} value={maskCnpjInput(field.value ?? '')} disabled />
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
                      <Input
                        {...field}
                        value={maskPhoneInput(field.value ?? '')}
                        onChange={(event) => field.onChange(maskPhoneInput(event.target.value))}
                      />
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
                  <FormLabel>Descrição</FormLabel>
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
                name="address.number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="Sala, bloco, andar" />
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
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a UF" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRAZILIAN_STATE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input
                        {...field}
                        value={maskZipCodeInput(field.value ?? '')}
                        onChange={(event) => field.onChange(maskZipCodeInput(event.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ponto de referência</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Ex: ao lado do shopping, torre B"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address.lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="-3.7319"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="-38.5267"
                      />
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
                Salvar alterações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

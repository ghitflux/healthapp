import { useEffect, useState, type ComponentType, type PropsWithChildren } from 'react';
import Constants from 'expo-constants';
import { PLACEHOLDER_STRIPE_KEY } from '@/lib/constants';

type StripeProviderProps = PropsWithChildren<{
  merchantIdentifier?: string;
  publishableKey: string;
}>;

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

export function OptionalStripeProvider({ children }: PropsWithChildren) {
  const [stripeRuntime, setStripeRuntime] = useState<{
    Provider: ComponentType<StripeProviderProps>;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    if (isExpoGo()) {
      return () => {
        mounted = false;
      };
    }

    void import('@stripe/stripe-react-native')
      .then((module) => {
        if (mounted) {
          setStripeRuntime({
            Provider: module.StripeProvider as ComponentType<StripeProviderProps>,
          });
        }
      })
      .catch((error) => {
        console.warn('Stripe unavailable in this runtime, continuing without native payments:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!stripeRuntime) {
    return <>{children}</>;
  }

  const StripeProvider = stripeRuntime.Provider;

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || PLACEHOLDER_STRIPE_KEY}
      merchantIdentifier="merchant.com.abase.saude"
    >
      {children}
    </StripeProvider>
  );
}

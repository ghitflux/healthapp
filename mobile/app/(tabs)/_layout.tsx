import { Redirect, Tabs } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { CalendarIcon, FileTextIcon, HomeIcon, UserIcon } from '@/lib/icons';

function renderTabIcon(
  Icon: typeof HomeIcon,
  color: string,
  size: number,
  focused: boolean
) {
  return <Icon size={size} color={color} fill={focused ? color : 'transparent'} />;
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => renderTabIcon(HomeIcon, color, size, focused),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Agendamentos',
          tabBarIcon: ({ color, size, focused }) => renderTabIcon(CalendarIcon, color, size, focused),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Prontuario',
          tabBarIcon: ({ color, size, focused }) => renderTabIcon(FileTextIcon, color, size, focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => renderTabIcon(UserIcon, color, size, focused),
        }}
      />
    </Tabs>
  );
}

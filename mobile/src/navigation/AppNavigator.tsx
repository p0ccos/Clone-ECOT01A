import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

// 1. Hook de autenticação 
import { useAuth } from '@/contexts/AuthContext';

// 2. Imports das telas de Auth 
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';

// 3. Imports das Telas do App 
import { MainBottomTabs } from '@/navigation/MainBottomTabs'; 
import SettingsScreen from '@/screens/SettingsScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import CommentsScreen from '@/screens/CommentsScreen';
import SearchScreen from '@/screens/SearchScreen'; 
import CreateNoticeScreen from '@/screens/CreateNoticeScreen'; 
import EditNoticeScreen from '@/screens/EditNoticeScreen'; 
import AddEventScreen from '@/screens/AddEventScreen'; 

const Stack = createNativeStackNavigator();

// AuthStack 
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// AppStack 
function AppStack() {
  return (
    // O seu Navigator já esconde o Header por padrão, o que é perfeito
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* --- Suas Telas Principais --- */}
      <Stack.Screen
        // Contém todas as abas (Home, Perfil, etc.)
        name="Main" 
        component={MainBottomTabs}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
      />
      <Stack.Screen 
        name="Comments" 
        component={CommentsScreen} 
      />
      <Stack.Screen 
        name="SearchScreen" 
        component={SearchScreen}
        options={{ headerShown: false }} 
      />
    
      {/* --- Grupo de Telas Modais --- */}
      <Stack.Group 
        screenOptions={{ 
          presentation: 'modal', // Faz a tela deslizar
          headerShown: true       // Mostra o Header SÓ para este grupo
        }}
      >
        <Stack.Screen 
          name="CreateNotice" 
          component={CreateNoticeScreen} 
          options={{ title: 'Criar Novo Aviso' }} 
        />
        
        <Stack.Screen 
          name="EditNoticeScreen" 
          component={EditNoticeScreen} 
          options={{ title: 'Editar Aviso' }}
        />
        
        <Stack.Screen 
          name="AddEventScreen" 
          component={AddEventScreen} 
          options={{ title: 'Adicionar Evento' }} 
        />

      </Stack.Group>

      
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
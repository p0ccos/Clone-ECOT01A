import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { HomeTopTabs } from '@/navigation/HomeTopTabs';
import ProfileScreen from '@/screens/ProfileScreen'; 
import CreatePostScreen from '@/screens/CreatePostScreen'; 
import { NoticesTopTabs } from '@/navigation/NoticesTopTabs'; 


const NoticesScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Quadro de Avisos</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Notificações</Text>
  </View>
);

const BottomTab = createBottomTabNavigator();

export function MainBottomTabs() {
  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#828282',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
        },

        tabBarIcon: ({ color, size, focused }) => {
          let iconName: React.ComponentProps<typeof Feather>['name'] = 'circle';

          if (route.name === 'HomeTabs') {
            iconName = 'home';
          } else if (route.name === 'Notices') {
            // MUDANÇA AQUI: Ícone de prancheta/aviso
            iconName = 'clipboard'; 
          } else if (route.name === 'Create') {
            iconName = 'plus-square';
          } else if (route.name === 'Notifications') {
            iconName = 'bell';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }
          
          return <Feather name={iconName} size={size} color={color} />;
        },
      })}
    >
      <BottomTab.Screen 
        name="HomeTabs" 
        component={HomeTopTabs} 
        options={{ title: 'Feed' }} 
      />
      
      <BottomTab.Screen 
        name="Notices" 
        component={NoticesTopTabs} 
        options={{ title: 'Avisos' }}
      />
      
      <BottomTab.Screen 
        name="Create" 
        component={CreatePostScreen}
        options={{ 
          title: 'Criar Publicidade',
          headerShown: false 
        }}
      />
      
      <BottomTab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ title: 'Notificações' }}
      />
      
      <BottomTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Meu Perfil' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const isFocused = navigation.isFocused();
            if (isFocused) {
              e.preventDefault();
              navigation.navigate('Profile', { username: undefined });
            }
          },
        })}
      />
    </BottomTab.Navigator>
  );
}
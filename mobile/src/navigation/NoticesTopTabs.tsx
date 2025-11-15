import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import AllBoardsScreen from '@/screens/AllBoardsScreen';
import MyNoticesScreen from '@/screens/MyNoticesScreen';

const Tab = createMaterialTopTabNavigator();

export function NoticesTopTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}> 
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold', textTransform: 'none' },
          tabBarIndicatorStyle: { backgroundColor: '#000' },
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: '#888',
        }}
      >
        <Tab.Screen 
          name="MyNotices" 
          component={MyNoticesScreen} 
          options={{ title: 'Meus Avisos' }} 
        />
        <Tab.Screen 
          name="AllBoards" 
          component={AllBoardsScreen} 
          options={{ title: 'Quadros' }} 
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
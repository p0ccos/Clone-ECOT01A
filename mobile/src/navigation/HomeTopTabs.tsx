import React from 'react';

import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps, 
} from '@react-navigation/material-top-tabs';


import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants'; 
import FeedScreen from '@/screens/HomeScreen'; 
import CalendarScreen from '@/screens/CalendarScreen';

const Calendar = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Tela de Calendário (WIP)</Text>
  </View>
);

const TopTab = createMaterialTopTabNavigator();

const CustomTopTabBar = (props: MaterialTopTabBarProps) => { 
  const { state, navigation } = props;
  const mainNavigation = useNavigation<any>(); 

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTabs}>
        {state.routes.map((route, index) => { 
          const isActive = state.index === index; 
          
          // Lógica para decidir o que renderizar: Texto ou Ícone
          let tabContent;
          if (route.name === 'Calendario') {
            tabContent = (
              <Feather 
                name="calendar" // O ícone
                size={22} // Tamanho
                color={isActive ? '#000000' : 'rgba(0, 0, 0, 0.4)'} // Cor
              />
            );
          } else {
            tabContent = (
              <Text
                style={[
                  styles.headerTab,
                  isActive && styles.headerTabActive,
                ]}
              >
                {route.name}
              </Text>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}

              //padding diferente para o ícone
              style={[
                styles.tabButton, 
                route.name === 'Calendario' && styles.tabButtonIcon
              ]}
            >
              {tabContent}
              
              {/* Só mostra o indicador se for ativo E NÃO for o calendário */}
              {isActive && route.name !== 'Calendario' && (
                 <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Ícones da direita (DM e Busca)*/}
      <View style={styles.headerIcons}>
        <TouchableOpacity>
          <Feather name="mail" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => mainNavigation.navigate('SearchScreen')}>
          <Feather name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

//telas ao navegador
export function HomeTopTabs() {
  return (
    <TopTab.Navigator
      tabBar={(props) => <CustomTopTabBar {...props} />}
      style={{ paddingTop: Constants.statusBarHeight, backgroundColor: '#F0F2F5' }}
    >
      <TopTab.Screen 
        name="Para você" 
        component={FeedScreen}
        initialParams={{ feedType: 'for-you' }} 
      />
      
      <TopTab.Screen 
        name="Seguindo" 
        component={FeedScreen}
        initialParams={{ feedType: 'following' }} 
      />
      
      <TopTab.Screen 
        name="Calendario" // O nome que o CustomTopTabBar vai ler
        component={CalendarScreen} 
      />
    </TopTab.Navigator>
  );
}

// Ajuste de Estilo
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#F0F2F5',
  },
  headerTabs: {
    flexDirection: 'row',
    gap: 24, 
    alignItems: 'center',
    flex: 1, 
  },
  tabButton: {
    paddingBottom: 10,
    position: 'relative',
  },
  tabButtonIcon: {
    paddingBottom: 10, 
  },
  headerTab: {
    fontWeight: '600',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  headerTabActive: {
    color: '#000000',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    width: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
});
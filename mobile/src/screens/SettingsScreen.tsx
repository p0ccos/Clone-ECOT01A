import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  const handleSair = () => {
    Alert.alert("Confirmar Saída", "Você tem certeza?",
      [{ text: "Cancelar", style: "cancel" },
       { text: "Sair", style: "destructive", onPress: () => logout() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Falso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Lista de Opções */}
      <View style={styles.container}>
        
        {/*Botão de "Editar Perfil" */}
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={() => navigation.navigate('EditProfile')} // Navega para a nova tela
        >
          <Ionicons name="person-circle-outline" size={24} color="#333" />
          <Text style={styles.optionText}>Editar Perfil</Text>
        </TouchableOpacity>

        {}

        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="lock-closed-outline" size={24} color="#333" />
          <Text style={styles.optionText}>Privacidade</Text>
        </TouchableOpacity>

        {/* Botão de Sair*/}
        <TouchableOpacity 
          style={[styles.optionButton, styles.logoutButton]} 
          onPress={handleSair}
        >
          <Ionicons name="log-out-outline" size={24} color="#DC3545" />
          <Text style={[styles.optionText, styles.logoutText]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  container: { flex: 1, padding: 16, },
  optionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', },
  optionText: { fontSize: 18, marginLeft: 16, color: '#333', },
  logoutButton: { marginTop: 24, borderBottomWidth: 0, },
  logoutText: { color: '#DC3545', fontWeight: '600', }
});
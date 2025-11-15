import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';


import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext'; 
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Ajuste o tipo se necessário
type AuthStackParamList = { Login: undefined; Register: undefined; };

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

const RegisterScreen: React.FC = () => {
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const { register } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const handleRegister = async () => {
    //  Validação atualizada
    if (!nome.trim() || !username.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    
    setIsSubmitting(true); 
    
    try {
      // Chamada de 'register' com username
      await register(nome, username.toLowerCase(), email, senha);
      // Se não deu erro, o login foi feito e o AuthProvider cuidou de tudo
      // (Não precisa mais navegar para o Login, o usuário já está logado)
      // navigation.navigate('Login'); <-- Removido, o 'register' já faz login
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro no Cadastro', error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.appTitle}>UNIFEED</Text>
          <Text style={styles.title}>Criar uma conta</Text>
          <Text style={styles.subtitle}>
            Insira seu e-mail universitário para se cadastrar
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#888"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!isSubmitting} 
            />
            {/* --- CAMPO DE USERNAME --- */}
            <TextInput
              style={styles.input}
              placeholder="@username"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none" 
              returnKeyType="next"
              editable={!isSubmitting} 
            />
            <TextInput
              style={styles.input}
              placeholder="email@dominio.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              editable={!isSubmitting} 
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#888"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              returnKeyType="done"
              editable={!isSubmitting} 
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister} 
            disabled={isSubmitting} 
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Continuar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={isSubmitting}>
            <Text style={styles.loginLink}>Já tem uma conta? Login</Text>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            Ao clicar em continuar, você concorda com os nossos
            <Text style={styles.legalBold}> Termos de Serviço </Text>
            e com a
            <Text style={styles.legalBold}> Política de Privacidade</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

//Estilos
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingVertical: 20,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 50,
    color: '#000',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    height: 52,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#000',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    textAlign: 'center',
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 20,
  },
  legalText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginHorizontal: 10,
    lineHeight: 18,
  },
  legalBold: {
    fontWeight: 'bold',
    color: '#555',
  },
});

export default RegisterScreen;
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = { Login: undefined; Register: undefined; };
interface LoginScreenProps { navigation: StackNavigationProp<RootStackParamList, 'Login'>; }

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleRegister = () => { console.log('Navegando para a tela de Registro...'); navigation.navigate('Register'); };

  const handleContinue = async () => {
    if (!identifier || !password) { Alert.alert('Erro', 'Preencha todos os campos.'); return; }
    setLoading(true);
    try { await login(identifier.toLowerCase(), password); }
    catch (error: any) {
      const errorMessage = error.message || 'Erro de conexão. Tente novamente.';
      const userNotFoundMsg = 'Usuário não encontrado';
      const wrongPasswordMsg = 'Senha incorreta';
      if (errorMessage.includes(userNotFoundMsg)) { Alert.alert('Usuário não encontrado', 'Parece que você ainda não tem uma conta. Deseja criar uma agora?', [{ text: 'Tentar Novamente', style: 'cancel' }, { text: 'Criar Conta', onPress: handleRegister },]); }
      else if (errorMessage.includes(wrongPasswordMsg)) { Alert.alert('Falha no Login', 'A senha está incorreta. Tente novamente.'); }
      else { Alert.alert('Falha no Login', errorMessage); }
    }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>UNIFEED</Text>
        <Text style={styles.subtitle}>Entre</Text>
        <TextInput style={styles.input} placeholder="Email ou @username" autoCapitalize="none" value={identifier} onChangeText={setIdentifier} editable={!loading} />
        <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} editable={!loading} />
        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Continuar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRegister} disabled={loading}>
          <Text style={styles.registerText}>Não tem uma conta? Registrar</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>Ao clicar em continuar, você concorda com os nossos <Text style={styles.linkText}>Termos de Serviço</Text> e com a <Text style={styles.linkText}>Política de Privacidade</Text></Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 30, paddingTop: 100, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000', marginBottom: 80 },
  subtitle: { fontSize: 18, color: '#000000', marginBottom: 20 },
  input: { width: '100%', height: 50, backgroundColor: '#FFFFFF', borderRadius: 5, borderWidth: 1, borderColor: '#CCCCCC', paddingHorizontal: 15, marginBottom: 15 },
  button: { width: '100%', height: 50, backgroundColor: '#000000', borderRadius: 5, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  registerText: { color: '#000000', fontSize: 16, marginTop: 20, marginBottom: 20 },
  termsText: { fontSize: 12, color: '#666666', textAlign: 'center', paddingHorizontal: 20, marginTop: 'auto', marginBottom: 20 },
  linkText: { fontWeight: 'bold', color: '#000000' },
});

export default LoginScreen;

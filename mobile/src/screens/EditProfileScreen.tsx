import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView 
} from 'react-native';


import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';


import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext'; 
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

interface ProfileFormData {
  name: string;
  username: string;
  course: string; 
  bio: string;    
}

export default function EditProfileScreen() {
  const { user, updateUserContext, token, API_URL } = useAuth();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false); 
  const [isUploading, setIsUploading] = useState(false);
  
  // --- ATUALIZAR O ESTADO INICIAL ---
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    username: user?.username || '', 
    course: user?.course || '', 
    bio: user?.bio || '',       
  });

  // Funções de Edição 

  const handleSave = async () => {
    if (!user) return; 
    setLoading(true);
    try {
      // O 'formData' agora inclui o 'username', então a API vai recebê-lo
      const response = await fetch(`${API_URL}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const updatedUser = await response.json();
      if (!response.ok) { 
        throw new Error(updatedUser.error); 
      }
      updateUserContext(updatedUser);
      setLoading(false);
      Alert.alert("Sucesso", "Perfil atualizado!");
      navigation.goBack(); 
    } catch (error: any) {
      setLoading(false); 
      Alert.alert("Erro", error.message); 
    }
  };

  const handleAvatarPress = () => {
    Alert.alert("Mudar foto do perfil", "Escolha:",
      [{ text: "Tirar Foto", onPress: takePhoto },
       { text: "Escolher da Galeria", onPress: pickImage },
       { text: "Cancelar", style: "cancel" }]
    );
  };
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária!'); return; }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7, });
    if (!result.canceled) { uploadImage(result.assets[0].uri); }
  };
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária!'); return; }
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7, });
    if (!result.canceled) { uploadImage(result.assets[0].uri); }
  };

  //UPLOAD DE FOTO
  const uploadImage = async (uri: string) => {
    if (!user) return; 
    setIsUploading(true);
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename!);
    const type = match ? `image/${match[1]}` : `image`;
    formData.append('avatar', { uri: uri, name: filename, type } as any);

    try {
      const response = await fetch(`${API_URL}/profile/upload-avatar`, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` }, });
      const updatedUser = await response.json();
      if (!response.ok) { throw new Error(updatedUser.error); }
      updateUserContext(updatedUser); 
      Alert.alert('Sucesso', 'Foto do perfil atualizada!');
    } catch (error: any) { Alert.alert('Erro', error.message);
    } finally { setIsUploading(false); }
  };

  if (!user) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }
  
  const avatarSource = user.avatar_url 
    ? { uri: `${API_URL}${user.avatar_url}` } 
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.editFormContainer}>
        {/* Header da Edição (Salvar/Cancelar) */}
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.editTitle}>Editar Perfil</Text>
          <TouchableOpacity style={styles.saveButtonHeader} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.buttonText}>Salvar</Text>}
          </TouchableOpacity>
        </View>

        {/* Avatar e botão da câmera */}
        <View style={styles.profileHeader}>
          {}
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <TouchableOpacity 
            style={styles.avatarEditButton}
            onPress={handleAvatarPress}
            disabled={isUploading} 
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Nome</Text>
          <TextInput 
            style={styles.input} 
            value={formData.name} 
            onChangeText={(text) => setFormData(p => ({ ...p, name: text }))} 
          />
          
          {}
          <Text style={styles.label}>Username</Text>
          <TextInput 
            style={styles.input} 
            value={formData.username} 
            onChangeText={(text) => setFormData(p => ({ 
              ...p, 
              username: text.replace(/@/g, '').toLowerCase() 
            }))} 
            autoCapitalize="none"
            placeholder="@username"
          />
          
          <Text style={styles.label}>Curso</Text>
          <TextInput 
            style={styles.input} 
            value={formData.course} 
            onChangeText={(text) => setFormData(p => ({ ...p, course: text }))} 
          />
          <Text style={styles.label}>Bio</Text>
          <TextInput 
            style={[styles.input, styles.bioInput]} 
            value={formData.bio} 
            onChangeText={(text) => setFormData(p => ({ ...p, bio: text }))} 
            multiline 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  profileHeader: { position: 'relative', alignItems: 'center', marginBottom: 24, marginTop: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#000000', backgroundColor: '#EEE' },
  avatarEditButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000000', padding: 8, borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  
  formContainer: { width: '100%', paddingHorizontal: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#F0F2F5', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, width: '100%' },
  bioInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 },
  
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  cancelButtonText: { color: '#555', fontSize: 16, fontWeight: 'bold' },
  
  editFormContainer: { paddingBottom: 50, alignItems: 'center' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 16, paddingVertical: 12 },
  editTitle: { fontSize: 18, fontWeight: 'bold' },
  saveButtonHeader: { backgroundColor: '#28A745', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 70, alignItems: 'center' },
});
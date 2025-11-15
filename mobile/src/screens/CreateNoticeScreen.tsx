import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';

// O tipo de dado que vem da API /boards
type Board = {
  id: string;
  name: string;
  is_member: boolean;
};

// O que vamos anexar
type Attachment = {
  uri: string;
  name: string;
  type: string; // ex: 'image/jpeg' ou 'application/pdf'
  fileType: 'image' | 'pdf'; // Nosso controle interno
};

export default function CreateNoticeScreen() {
  const { token, API_URL } = useAuth();
  const navigation = useNavigation();
  
  const [myBoards, setMyBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | undefined>();
  
  const [subject, setSubject] = useState(''); // Matéria
  const [content, setContent] = useState(''); // Texto
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  const [loadingBoards, setLoadingBoards] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Buscar os quadros que o usuário *participa*
  useEffect(() => {
    const fetchMyBoards = async () => {
      try {
        const response = await fetch(`${API_URL}/boards`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data: Board[] = await response.json();
        if (response.ok) {
          // Filtra só os quadros que o usuário é membro
          const userIsMemberOf = data.filter(board => board.is_member);
          setMyBoards(userIsMemberOf);
          // pré-seleciona o primeiro quadro da lista
          if (userIsMemberOf.length > 0) {
            setSelectedBoardId(userIsMemberOf[0].id);
          }
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar seus quadros.");
      } finally {
        setLoadingBoards(false);
      }
    };
    fetchMyBoards();
  }, [token, API_URL]);

  // 2. Funções de Anexo
  const handlePickImage = async () => {
    // Pedir permissão
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Precisamos da permissão da câmera para isso.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      setAttachment({
        uri: file.uri,
        name: file.fileName || `photo_${Date.now()}.jpg`,
        type: file.mimeType || 'image/jpeg',
        fileType: 'image',
      });
    }
  };

  const handlePickPDF = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled && result.assets) {
        const file = result.assets[0];
        setAttachment({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
          fileType: 'pdf',
        });
      }
    } catch (err) {
      console.log("Erro ao selecionar PDF:", err);
    }
  };

  // 3. Função de Envio (Submit)
  const handleSubmit = async () => {
    if (!selectedBoardId) {
      Alert.alert("Erro", "Você precisa selecionar um quadro.");
      return;
    }
    if (!content) {
      Alert.alert("Erro", "O conteúdo do aviso não pode estar vazio.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    formData.append('content', content);
    formData.append('subject', subject || 'Geral'); // Se a matéria estiver vazia, manda "Geral"

    // Anexar o arquivo (se existir)
    if (attachment) {
      formData.append('file', {
        uri: attachment.uri,
        name: attachment.name,
        type: attachment.type,
      } as any);
    }

    try {
      const response = await fetch(`${API_URL}/boards/${selectedBoardId}/notices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Aviso publicado!");
        navigation.goBack(); // Volta para a tela anterior
      } else {
        const err = await response.json();
        throw new Error(err.error || "Erro desconhecido");
      }
    } catch (error: any) {
      Alert.alert("Erro ao postar", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Renderização do Componente ---

  if (loadingBoards) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (myBoards.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Você precisa entrar em um quadro antes de postar avisos.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: 'blue', marginTop: 10 }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Postar no Quadro:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedBoardId}
          onValueChange={(itemValue) => setSelectedBoardId(itemValue)}
        >
          {myBoards.map(board => (
            <Picker.Item key={board.id} label={board.name} value={board.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Matéria (Opcional):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Cálculo A (ou deixe em branco para 'Geral')"
        value={subject}
        onChangeText={setSubject}
      />

      <Text style={styles.label}>Aviso:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Escreva seu aviso aqui..."
        value={content}
        onChangeText={setContent}
        multiline
      />

      <Text style={styles.label}>Anexo (Opcional):</Text>
      <View style={styles.attachRow}>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
          <Feather name="image" size={20} color="#333" />
          <Text style={styles.attachText}>Anexar Imagem</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickPDF}>
          <Feather name="file-text" size={20} color="#333" />
          <Text style={styles.attachText}>Anexar PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Preview do Anexo */}
      {attachment && (
        <View style={styles.attachmentPreview}>
          <Feather name={attachment.fileType === 'image' ? 'check-circle' : 'file'} size={20} color="green" />
          <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
          <TouchableOpacity onPress={() => setAttachment(null)}>
            <Feather name="x" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Botão de Envio */}
      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.submitButtonText}>Publicar Aviso</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top', 
  },
  attachRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  attachText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginTop: 16,
  },
  attachmentName: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40, 
  },
  submitButtonDisabled: {
    backgroundColor: '#888',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
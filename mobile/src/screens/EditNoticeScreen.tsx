import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Notice } from '@/components/NoticeCard'; 

//  tipo de parâmetro
type EditNoticeRouteParams = {
  notice: Notice;
};

// Informamos ao useRoute qual o tipo de parâmetro
type EditScreenRouteProp = RouteProp<{ params: EditNoticeRouteParams }, 'params'>;

export default function EditNoticeScreen() {
  const { token, API_URL } = useAuth();
  const navigation = useNavigation();
  
  // Pegamos os dados do aviso que foi passado como parâmetro
  const route = useRoute<EditScreenRouteProp>();
  const { notice } = route.params;

  // Os states são pré-preenchidos com os dados do aviso!
  const [subject, setSubject] = useState(notice.subject);
  const [content, setContent] = useState(notice.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content) {
      Alert.alert("Erro", "O conteúdo do aviso não pode estar vazio.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Usamos a Rota 26 (PUT) e o ID do aviso
      const response = await fetch(`${API_URL}/notices/${notice.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // PUT de texto é JSON, não FormData
        },
        body: JSON.stringify({
          subject: subject || 'Geral', // Se apagar, vira 'Geral'
          content: content,
        }),
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Aviso atualizado!");
        navigation.goBack(); // Volta para o feed
      } else {
        const err = await response.json();
        throw new Error(err.error || "Erro desconhecido");
      }
    } catch (error: any) {
      Alert.alert("Erro ao atualizar", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Matéria (Opcional):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Cálculo 1 (ou deixe em branco para 'Geral')"
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
      
      <Text style={styles.note}>
        A edição de anexos (fotos/PDFs) não é suportada no momento.
      </Text>

      {/* Botão de Envio */}
      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.submitButtonText}>Salvar Edições</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
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
  },
  note: { 
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  }
});
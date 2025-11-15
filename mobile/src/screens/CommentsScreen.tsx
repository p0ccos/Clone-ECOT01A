import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

// --- Interfaces ---
interface Comment {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
}

// --- O componente agora aceita 'api_url' ---
const CommentItem: React.FC<{ comment: Comment; api_url: string }> = ({ comment, api_url }) => {
  
  // --- 'api_url' para construir o link completo ---
  const avatarSource = comment.author_avatar ? { uri: api_url + comment.author_avatar } : null;
  
  return (
    <View style={styles.commentContainer}>
      {avatarSource ? (
        <Image source={avatarSource} style={styles.commentAvatar} />
      ) : (
        <View style={styles.commentAvatar} /> // Placeholder
      )}
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{comment.author_name}</Text>
        <Text style={styles.commentContent}>{comment.content}</Text>
      </View>
    </View>
  );
};


export default function CommentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { API_URL, token } = useAuth(); 
  
  const { postId } = route.params as { postId: number }; 

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false); 

  // --- Funções  ---
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar comentários');
      const data = await response.json();
      setComments(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };
  const handlePostComment = async () => { 
    if (newComment.trim() === '') return; 
    setPosting(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment }),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Falha ao postar comentário');
      }

      const createdComment: Comment = responseData; 

      setComments(prevComments => [...prevComments, createdComment]);
      setNewComment(''); 
      
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setPosting(false);
    }
  };
  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
        keyboardVerticalOffset={0} 
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comentários</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Lista de Comentários */}
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" />
        ) : (
          <FlatList
            data={comments}
            // --- API_URL para o CommentItem ---
            renderItem={({ item }) => <CommentItem comment={item} api_url={API_URL} />}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum comentário ainda.</Text>
            }
          />
        )}

        {/* Caixa de Input para novo comentário */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Adicione um comentário..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handlePostComment}
            disabled={posting}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Estilos  ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  list: { flex: 1, },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#828282' },
  
  // Estilos do Item de Comentário
  commentContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#EEE',
    marginRight: 12,
  },
  commentBody: {
    flex: 1, 
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 19,
  },

  // Estilos da Caixa de Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100, 
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
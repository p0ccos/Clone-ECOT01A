import React, { useEffect, useState } from 'react'; 
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

// Definição do tipo de dado do Quadro
type Board = {
  id: string;
  name: string;
  description: string;
  member_count: string;
  is_member: boolean;
};

export default function AllBoardsScreen() {
  const { token, API_URL } = useAuth(); 
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Função para buscar os quadros
  const fetchBoards = async () => {
    try {
      const response = await fetch(`${API_URL}/boards`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setBoards(data);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível carregar os quadros.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // Função para Entrar/Sair
  const handleToggleJoin = async (boardId: string, isMember: boolean) => {
    setBoards((currentBoards: Board[]) => 
      currentBoards.map((board: Board) => 
        board.id === boardId 
          ? { ...board, is_member: !isMember, member_count: isMember ? String(Number(board.member_count) - 1) : String(Number(board.member_count) + 1) }
          : board
      )
    );

    try {
      const response = await fetch(`${API_URL}/boards/${boardId}/toggle-join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível realizar a ação.");
      fetchBoards(); // Reverte a mudança se der erro
    }
  };

  const renderItem = ({ item }: { item: Board }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Feather name="hash" size={24} color="#000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.boardName}>{item.name}</Text>
          <Text style={styles.boardMembers}>{item.member_count} membros</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, item.is_member ? styles.joinedButton : styles.unjoinedButton]}
          onPress={() => handleToggleJoin(item.id, item.is_member)}
        >
          <Text style={[styles.joinButtonText, item.is_member ? styles.joinedText : styles.unjoinedText]}>
            {item.is_member ? 'Sair' : 'Entrar'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={boards}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBoards(); }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum quadro disponível.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFF', padding: 16, marginBottom: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  boardName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  boardMembers: { fontSize: 12, color: '#666' },
  description: { fontSize: 14, color: '#444', marginTop: 4 },
  joinButton: {
    paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1
  },
  unjoinedButton: { backgroundColor: '#000', borderColor: '#000' }, 
  joinedButton: { backgroundColor: '#FFF', borderColor: '#CCC' },   
  joinButtonText: { fontSize: 12, fontWeight: '600' },
  unjoinedText: { color: '#FFF' },
  joinedText: { color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' }
});
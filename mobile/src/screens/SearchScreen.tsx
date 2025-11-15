import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons'; 
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';

// --- Importa o navegador de abas ---
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// --- hook useDebounce ---
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- Tipos de Resultado ---
interface UserSearchResult {
  id: number;
  name: string;
  username: string;
  avatar_url: string | null;
  is_following_by_me: boolean;
}

// --- Tipo para o resultado dos Quadros ---
interface BoardSearchResult {
  id: string; // UUID
  name: string;
  description: string;
  member_count: string;
  is_member: boolean;
}

// --- Componente UserResultItem ---
const UserResultItem: React.FC<{ user: UserSearchResult }> = ({ user }) => {
  const { API_URL, token } = useAuth();
  const navigation = useNavigation<any>();
  const [isFollowing, setIsFollowing] = useState(user.is_following_by_me);
  const [isLoading, setIsLoading] = useState(false);

  const getSafeImageUri = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return { uri: path };
    if (path.startsWith('/')) return { uri: `${API_URL}${path}` };
    return null;
  };
  
  const avatarSource = getSafeImageUri(user.avatar_url);

  const goToProfile = () => {
    navigation.navigate('Main', { 
      screen: 'Profile',       
      params: { username: user.username }, 
    });
  };

  const handleToggleFollow = async () => {
    setIsLoading(true);
    const action = isFollowing ? 'unfollow' : 'follow';
    const method = isFollowing ? 'DELETE' : 'POST';
    try {
      const response = await fetch(
        `${API_URL}/users/${user.username}/${action}`,
        {
          method: method,
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Falha na operação.');
      setIsFollowing(!isFollowing); 
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.resultItem} onPress={goToProfile}>
      {avatarSource ? (
        <Image source={avatarSource} style={styles.avatar} />
      ) : (
        <View style={styles.avatar} /> // Placeholder
      )}
      <View style={styles.userInfo}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          isFollowing ? styles.unfollowButton : styles.followButtonActive,
        ]}
        onPress={handleToggleFollow}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isFollowing ? '#333' : '#FFF'} />
        ) : (
          <Text
            style={[
              styles.followButtonText,
              isFollowing ? styles.unfollowButtonText : styles.followButtonTextActive,
            ]}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// --- Componente para o Item de Quadro (Comunidade) ---
// (Lógica de "Entrar/Sair" copiada do AllBoardsScreen)
const BoardResultItem: React.FC<{ board: BoardSearchResult }> = ({ board }) => {
  const { API_URL, token } = useAuth();
  const [isMember, setIsMember] = useState(board.is_member);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleJoin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/boards/${board.id}/toggle-join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha na operação.');
      setIsMember(!isMember); 
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.resultItem}>
      <View style={[styles.avatar, styles.boardAvatar]}>
        <Feather name="hash" size={24} color="#333" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.name}>{board.name}</Text>
        <Text style={styles.username}>{board.member_count} membros</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton, 
          isMember ? styles.unfollowButton : styles.joinButtonActive, // Estilo "join"
        ]}
        onPress={handleToggleJoin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isMember ? '#333' : '#FFF'} />
        ) : (
          <Text
            style={[
              styles.followButtonText,
              isMember ? styles.unfollowButtonText : styles.followButtonTextActive,
            ]}
          >
            {isMember ? 'Sair' : 'Entrar'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};


// --- Componente-Filho 1 (Lista de Usuários) ---
const UserSearchList: React.FC<{ query: string }> = ({ query }) => {
  const { API_URL, token } = useAuth();
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/search/users?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Falha ao buscar.');
      const data: UserSearchResult[] = await response.json();
      setResults(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim().length > 1) {
      searchUsers(query);
    } else {
      setResults([]); 
    }
  }, [query]); 

  if (loading) {
    return <View style={styles.emptyContainer}><ActivityIndicator size="large" /></View>
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <UserResultItem user={item} />}
      style={{ backgroundColor: 'white' }}
      ListEmptyComponent={
        !loading && query.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          </View>
        ) : null
      }
    />
  );
};

// --- Componente-Filho 2 (Lista de Quadros) ---
const BoardSearchList: React.FC<{ query: string }> = ({ query }) => {
  const { API_URL, token } = useAuth();
  const [results, setResults] = useState<BoardSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Função de busca 
  const searchBoards = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/search/boards?q=${encodeURIComponent(searchQuery)}`, // Rota 27
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Falha ao buscar.');
      const data: BoardSearchResult[] = await response.json();
      setResults(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim().length > 1) {
      searchBoards(query);
    } else {
      setResults([]); 
    }
  }, [query]); 

  if (loading) {
    return <View style={styles.emptyContainer}><ActivityIndicator size="large" /></View>
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id} // UUID é string
      renderItem={({ item }) => <BoardResultItem board={item} />} // Renderiza o novo item
      style={{ backgroundColor: 'white' }}
      ListEmptyComponent={
        !loading && query.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum quadro encontrado.</Text>
          </View>
        ) : null
      }
    />
  );
};


// --- Cria o Navegador de Abas ---
const Tab = createMaterialTopTabNavigator();

// --- Tela Principal ---
export default function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300); 

  // Foco no input 
  const textInputRef = React.useRef<TextInput>(null);
  useFocusEffect(useCallback(() => {
    textInputRef.current?.focus();
  }, []));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TextInput
          ref={textInputRef}
          style={styles.searchInput}
          placeholder="Buscar usuários ou quadros..." 
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {/* --- Renderiza o Navegador de Abas --- */}
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { fontWeight: 'bold' },
          tabBarIndicatorStyle: { backgroundColor: '#000' }
        }}
      >
        <Tab.Screen name="Usuários">
          {() => <UserSearchList query={debouncedQuery} />}
        </Tab.Screen>
        <Tab.Screen name="Quadros">
          {() => <BoardSearchList query={debouncedQuery} />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60, 
    alignItems: 'center',
    backgroundColor: 'white',
  },
  emptyText: {
    fontSize: 16,
    color: '#828282',
  },
  // Estilos do Item de Resultado (Usuário)
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEE',
    marginRight: 12,
  },
  // --- Estilo para o avatar do Quadro ---
  boardAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1, 
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  // Estilos de Botão 
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  followButtonActive: {
    backgroundColor: '#007AFF', 
  },
  // ---  Estilo para o botão "Entrar" (copiado do "Seguir") ---
  joinButtonActive: {
    backgroundColor: '#000', 
  },
  unfollowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  followButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  followButtonTextActive: {
    color: '#FFFFFF',
  },
  unfollowButtonText: {
    color: '#333',
  },
});
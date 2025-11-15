import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  StatusBar,
  TouchableOpacity 
} from 'react-native';


import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';


import { useAuth } from '@/contexts/AuthContext'; 
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

export interface Post {
  id: number;
  content: string | null;
  image_url: string | null;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  author_course: string | null; 
  author_username: string; 
  total_likes: number;  
  liked_by_me: boolean;
  total_comments: number; 
}

export const PostItem: React.FC<{ post: Post, onToggleLike: (postId: number) => void }> = ({ post, onToggleLike }) => {
  
  const { API_URL } = useAuth();

  const getSafeImageUri = (path: string | null | undefined) => {
    if (!path) {
      return null;
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return { uri: path };
    }
    if (path.startsWith('/')) {
      return { uri: `${API_URL}${path}` };
    }
    return null; 
  };

  const authorAvatarSource = getSafeImageUri(post.author_avatar);
  const postImageSource = getSafeImageUri(post.image_url);

  const likeIcon = post.liked_by_me ? 'heart' : 'heart-outline';
  const likeColor = post.liked_by_me ? '#E23C3C' : '#333'; 

  const navigation = useNavigation<any>();

  const goToComments = () => {
    navigation.navigate('Comments', { postId: post.id });
  };
  
  const goToProfile = () => {
    navigation.navigate('Profile', { username: post.author_username });
  };

  return (
    <View style={styles.postContainer}>
      <TouchableOpacity onPress={goToProfile} style={styles.postHeader}>
        {authorAvatarSource ? (
          <Image source={authorAvatarSource} style={styles.postAvatar} />
        ) : (
          <View style={styles.postAvatar} /> 
        )}
        <View style={styles.postAutorContainer}>
          <Text style={styles.postAutor}>{post.author_name}</Text>
          <Text style={styles.postUsername}>@{post.author_username}</Text> 
        </View>
      </TouchableOpacity>
      
      {post.content && ( <Text style={styles.postConteudo}>{post.content}</Text> )}
      
      {}
      {postImageSource && ( <Image source={postImageSource} style={styles.postImage} /> )}

      {}
      <View style={styles.interactionBar}>
        <TouchableOpacity 
          style={styles.interactionButton}
          onPress={() => onToggleLike(post.id)}
        >
          <Ionicons name={likeIcon} size={24} color={likeColor} />
          <Text style={[styles.interactionText, { color: likeColor }]}>
            {post.total_likes}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.interactionButton}
          onPress={goToComments}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#333" />
          <Text style={styles.interactionText}>
            {post.total_comments}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type FeedScreenRouteParams = {
  feedType?: 'for-you' | 'following';
};
type FeedScreenRouteProp = RouteProp<{ params: FeedScreenRouteParams }, 'params'>;


export default function HomeScreen() {
  const { API_URL, token, user } = useAuth(); 
  
  const route = useRoute<FeedScreenRouteProp>();
  const feedType = route.params?.feedType || 'for-you'; 

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    if (!user) return; 

    const endpoint = feedType === 'following' ? '/feed/following' : '/posts';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) { throw new Error('Falha ao buscar posts'); }
      const data: Post[] = await response.json(); 
      setPosts(data);
    } catch (error: any) {
      console.error(error.message);
      Alert.alert('Erro', 'Não foi possível carregar o feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchPosts(); }, [user, feedType]));
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPosts(); }, [user, feedType]);

  const handleToggleLike = async (postId: number) => {
    setPosts(currentPosts => 
      currentPosts.map(p => {
        if (p.id === postId) {
          const currentLikes = Number(p.total_likes); 
          const newLikedByMe = !p.liked_by_me;
          const newTotalLikes = newLikedByMe ? currentLikes + 1 : currentLikes - 1; 
          return { ...p, liked_by_me: newLikedByMe, total_likes: newTotalLikes };
        }
        return p;
      })
    );
    try {
      await fetch(`${API_URL}/posts/${postId}/toggle-like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar a curtida.');
      fetchPosts(); 
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" />
         </View>
       </SafeAreaView>
    );
  }

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      {feedType === 'following' ? (
        <>
          <Text style={styles.emptyText}>Feed "Seguindo" vazio</Text>
          <Text style={styles.emptySubText}>Comece a seguir pessoas para ver os posts delas aqui.</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyText}>Nenhum post ainda.</Text>
          <Text style={styles.emptySubText}>Seja o primeiro a postar!</Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostItem 
            post={item} 
            onToggleLike={handleToggleLike} 
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        style={styles.feed}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<EmptyState />} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5', },
  feed: { flex: 1, },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5', },
  emptyContainer: { flex: 1, paddingTop: 150, alignItems: 'center', paddingHorizontal: 20, },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#828282', marginTop: 8, textAlign: 'center' },
  postContainer: { backgroundColor: '#FFFFFF', padding: 16, marginVertical: 8, marginHorizontal: 16, borderRadius: 8, elevation: 1, },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE', marginRight: 12, },
  
  postAutorContainer: {
    flexDirection: 'column', 
  },
  postAutor: { 
    fontWeight: 'bold', 
    fontSize: 16, 
  },
  postUsername: {
    fontSize: 13,
    color: '#666', 
  },
  postCurso: { 
    fontSize: 12,
    color: '#666', 
  },

  postConteudo: { fontSize: 15, lineHeight: 22, marginBottom: 12, },
  postImage: { width: '100%', aspectRatio: 16/9, borderRadius: 8, backgroundColor: '#EEE', marginTop: 8, },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24, 
  },
  interactionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  }
});
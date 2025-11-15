import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';

import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { Post, PostItem } from './HomeScreen'; 

interface ProfileData {
  id: number;
  name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  followers_count: string; 
  following_count: string; 
  is_following_by_me: boolean;
}

type ProfileScreenRouteParams = {
  username?: string; 
};
type ProfileScreenRouteProp = RouteProp<
  { params: ProfileScreenRouteParams },
  'params'
>;


export default function ProfileScreen() {
  const { 
    user: authUser, 
    token, 
    API_URL, 
    isLoading: isAuthLoading 
  } = useAuth(); 
  
  const navigation = useNavigation<any>();
  const route = useRoute<ProfileScreenRouteProp>();

  const routeUsername = route.params?.username;
  const isMyProfile = !routeUsername || routeUsername === authUser?.username;

  const targetUsername = isMyProfile ? null : routeUsername;
  const targetId = isMyProfile ? authUser?.id : null;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);


  const fetchProfileData = async () => {
    if (isAuthLoading) return; 
    
    if ((!isMyProfile && !targetUsername) || (isMyProfile && !targetId)) {
      setLoading(false);
      return;
    }

    setLoading(true); 

    let profileEndpoint: string;
    let postsEndpoint: string;

    if (isMyProfile) {
      profileEndpoint = `${API_URL}/profile/id/${targetId}`;
      postsEndpoint = `${API_URL}/posts/user/id/${targetId}`;
    } else {
      profileEndpoint = `${API_URL}/profile/${targetUsername}`;
      postsEndpoint = `${API_URL}/posts/user/${targetUsername}`;
    }
    
    try {
      const [profileResponse, postsResponse] = await Promise.all([
        fetch(profileEndpoint, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(postsEndpoint, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!profileResponse.ok) throw new Error('Falha ao buscar perfil.');
      if (!postsResponse.ok) throw new Error('Falha ao buscar posts.');

      const profileData: ProfileData = await profileResponse.json();
      const postsData: Post[] = await postsResponse.json();

      setProfile(profileData);
      setUserPosts(postsData);
    } catch (error: any) {
      console.error(error.message);
      Alert.alert(
        'Erro',
        'Não foi possível carregar o perfil. Tente novamente.'
      );
      if (!isMyProfile) {
        navigation.goBack();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [isMyProfile, targetId, targetUsername, isAuthLoading]) 
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, [isMyProfile, targetId, targetUsername, isAuthLoading]);

  const handleToggleFollow = async () => {
    if (!profile || isMyProfile) return;

    const action = profile.is_following_by_me ? 'unfollow' : 'follow';
    const method = action === 'unfollow' ? 'DELETE' : 'POST';

    setProfile((currentProfile) => {
      if (!currentProfile) return null;
      const newFollowStatus = !currentProfile.is_following_by_me;
      const newFollowerCount =
        Number(currentProfile.followers_count) + (newFollowStatus ? 1 : -1);
      return {
        ...currentProfile,
        is_following_by_me: newFollowStatus,
        followers_count: String(newFollowerCount),
      };
    });

    try {
      const response = await fetch(
        `${API_URL}/users/${profile.username}/${action}`,
        {
          method: method,
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Falha na operação.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível completar a ação.');
      fetchProfileData();
    }
  };

  const handleToggleLike = async (postId: number) => {
    setUserPosts(currentPosts => 
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
      fetchProfileData(); 
    }
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert("Apagar Post", "Você tem certeza?",
      [{ text: "Cancelar", style: "cancel" },
       { text: "Apagar", style: "destructive",
         onPress: async () => {
           try {
             const response = await fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
             if (!response.ok && response.status !== 204) { throw new Error('Falha ao apagar.'); }
             setUserPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
             Alert.alert('Sucesso', 'Post apagado.');
           } catch (error: any) { Alert.alert('Erro', error.message); }
         }
       }]
    );
  };


  const renderProfileHeader = () => {
    if (!profile) {
      return (
        <View style={[styles.headerContainer, { paddingVertical: 50 }]}>
          <ActivityIndicator size="large"/>
        </View>
      );
    } 

    const avatarSource = profile.avatar_url 
      ? { uri: `${API_URL}${profile.avatar_url}` }
      : null;

    return (
      <View style={styles.headerContainer}>
        {isMyProfile && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')} 
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        )}

        <View style={styles.profileHeader}>
          {/* 'avatarSource' agora vai carregar a imagem */}
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
        </View>
        <View style={styles.displayContainer}>
          <Text style={styles.name}>{profile.name}</Text>
          
          <Text style={styles.username}>
            @{profile.username?.replace(/@/g, '') || 'sem-username'}
          </Text>
          
          <Text style={styles.bio}>{profile.bio || 'Sem bio definida'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Number(profile.followers_count) || 0}
            </Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Number(profile.following_count) || 0}
            </Text>
            <Text style={styles.statLabel}>Seguindo</Text>
          </View>
        </View>

        {!isMyProfile && (
          <View style={styles.buttonContainer}>
            {profile.is_following_by_me ? (
              <TouchableOpacity
                style={[styles.profileButton, styles.unfollowButton]}
                onPress={handleToggleFollow}
              >
                <Text style={[styles.profileButtonText, styles.unfollowButtonText]}>
                  Deixar de Seguir
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.profileButton, styles.followButton]}
                onPress={handleToggleFollow}
              >
                <Text style={[styles.profileButtonText, styles.followButtonText]}>
                  Seguir
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.postsTitle}>
          {isMyProfile ? 'Meus Posts' : `Posts de ${profile.name}`}
        </Text>
      </View>
    );
  };

  if ((loading || isAuthLoading) && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderProfileHeader}
        renderItem={({ item }) => (
          <View style={styles.postWrapper}>
            <PostItem
              post={item}
              onToggleLike={() => handleToggleLike(item.id)}
            />
            {isMyProfile && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePost(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#DC3545" />
              </TouchableOpacity>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyPostsText}>Nenhum post encontrado.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer: { paddingTop: 10, width: '100%', alignItems: 'center' },
  profileHeader: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16, 
    marginTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#EEE',
  },
  displayContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  name: { 
    // Usamos Platform.select para escolher o estilo
    fontSize: Platform.OS === 'android' ? 20 : 24, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 2,
    textAlign: 'center' // Mantém centralizado em ambos
  },
  username: { fontSize: 16, color: '#666', marginBottom: 8 },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16, 
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#828282',
    textTransform: 'uppercase',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#EFEFEF', 
  },
  profileButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  followButton: {
    backgroundColor: '#007AFF', 
  },
  followButtonText: {
    color: '#FFFFFF',
  },
  unfollowButton: {
    backgroundColor: 'transparent', 
    borderWidth: 1,
    borderColor: '#CCC',
  },
  unfollowButtonText: {
    color: '#DC3545', 
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    width: '100%',
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  postWrapper: { position: 'relative', paddingHorizontal: 16 },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 4,
    elevation: 2,
  },
  emptyPostsText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#828282',
  },
  settingsButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
});
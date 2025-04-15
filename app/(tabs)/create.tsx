// app/(tabs)/create.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Post type definition
interface Post {
  id: string;
  imageUri: string;
  caption: string;
  username: string;
  userImageUrl: string | null;
  timestamp: number;
  likes: string[]; // array of user IDs who liked the post
  comments: Comment[];
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export default function Create() {
  const { user } = useUser();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Load posts from AsyncStorage
  const loadPosts = async () => {
    try {
      const storedPosts = await AsyncStorage.getItem('posts');
      if (storedPosts) {
        setPosts(JSON.parse(storedPosts));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  // Save posts to AsyncStorage
  const savePosts = async (updatedPosts: Post[]) => {
    try {
      await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Error saving posts:', error);
    }
  };

  // Pick an image from the library
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Create a new post
  const createPost = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    setIsLoading(true);

    try {
      // Create new post object
      const newPost: Post = {
        id: Date.now().toString(),
        imageUri: selectedImage,
        caption: caption.trim(),
        username: user.username || user.firstName || 'Anonymous',
        userImageUrl: user.imageUrl,
        timestamp: Date.now(),
        likes: [],
        comments: [],
      };

      // Add to posts array
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      
      // Save to storage
      await savePosts(updatedPosts);

      // Reset form
      setSelectedImage(null);
      setCaption('');
      
      Alert.alert('Success', 'Your post has been created!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle like on a post
  const toggleLike = async (postId: string) => {
    if (!user) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const userLiked = post.likes.includes(user.id);
        return {
          ...post,
          likes: userLiked
            ? post.likes.filter(id => id !== user.id)
            : [...post.likes, user.id]
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    await savePosts(updatedPosts);
  };

  // Add comment to a post
  const addComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newCommentObj: Comment = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username || user.firstName || 'Anonymous',
          text: newComment.trim(),
          timestamp: Date.now(),
        };
        
        return {
          ...post,
          comments: [...post.comments, newCommentObj]
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    await savePosts(updatedPosts);
    setNewComment('');
    setCommentingOnPost(null);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // More than a day
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Create Post Section */}
      <View style={styles.createSection}>
        <Text style={styles.sectionTitle}>Create New Post</Text>
        
        {/* Image Picker */}
        <Pressable 
          style={styles.imagePicker} 
          onPress={pickImage}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={40} color="#666" />
              <Text style={styles.placeholderText}>Tap to select an image</Text>
            </View>
          )}
        </Pressable>
        
        {/* Caption Input */}
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor="#666"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />
        
        {/* Character Count */}
        <Text style={styles.charCount}>{caption.length}/200</Text>
        
        {/* Post Button */}
        <Pressable 
          style={[
            styles.postButton, 
            (!selectedImage || !caption.trim() || isLoading) && styles.disabledButton
          ]}
          onPress={createPost}
          disabled={!selectedImage || !caption.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </Pressable>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Posts Feed */}
      <View style={styles.feedSection}>
        <Text style={styles.sectionTitle}>Recent Posts</Text>
        
        {posts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Ionicons name="images-outline" size={40} color="#555" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to post something!</Text>
          </View>
        ) : (
          posts.map(post => (
            <View key={post.id} style={styles.post}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.postUser}>
                  {post.userImageUrl ? (
                    <Image source={{ uri: post.userImageUrl }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, styles.defaultAvatar]}>
                      <Text style={styles.avatarText}>{post.username.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={styles.username}>{post.username}</Text>
                </View>
                <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
              </View>
              
              {/* Post Image */}
              <Image source={{ uri: post.imageUri }} style={styles.postImage} />
              
              {/* Post Actions */}
              <View style={styles.postActions}>
                <Pressable onPress={() => toggleLike(post.id)} style={styles.actionButton}>
                  <Ionicons 
                    name={post.likes.includes(user?.id || '') ? "heart" : "heart-outline"} 
                    size={24} 
                    color={post.likes.includes(user?.id || '') ? "#FF3B30" : "white"} 
                  />
                </Pressable>
                <Pressable 
                  onPress={() => setCommentingOnPost(post.id)} 
                  style={styles.actionButton}
                >
                  <Ionicons name="chatbubble-outline" size={22} color="white" />
                </Pressable>
              </View>
              
              {/* Likes Count */}
              <Text style={styles.likesCount}>
                {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
              </Text>
              
              {/* Caption */}
              <View style={styles.captionContainer}>
                <Text style={styles.captionUsername}>{post.username}</Text>
                <Text style={styles.caption}>{post.caption}</Text>
              </View>
              
              {/* Comments */}
              {post.comments.length > 0 && (
                <View style={styles.commentsContainer}>
                  {post.comments.length > 3 && (
                    <Text style={styles.viewAllComments}>
                      View all {post.comments.length} comments
                    </Text>
                  )}
                  
                  {post.comments.slice(-3).map(comment => (
                    <View key={comment.id} style={styles.comment}>
                      <Text style={styles.commentUsername}>{comment.username}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Add Comment */}
              {commentingOnPost === post.id && (
                <View style={styles.addCommentContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#666"
                    value={newComment}
                    onChangeText={setNewComment}
                  />
                  <Pressable 
                    onPress={() => addComment(post.id)}
                    disabled={!newComment.trim()}
                    style={[
                      styles.postCommentButton,
                      !newComment.trim() && styles.disabledCommentButton
                    ]}
                  >
                    <Text style={styles.postCommentText}>Post</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  createSection: {
    padding: 20,
    paddingTop: 40,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imagePicker: {
    width: '100%',
    height: 250,
    backgroundColor: '#222',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    marginTop: 10,
  },
  captionInput: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  postButton: {
    backgroundColor: '#00bfff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  feedSection: {
    padding: 20,
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    padding: 30,
    borderRadius: 10,
    marginTop: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  post: {
    backgroundColor: '#222',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  defaultAvatar: {
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  username: {
    color: 'white',
    fontWeight: '600',
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    padding: 10,
  },
  actionButton: {
    marginRight: 15,
  },
  likesCount: {
    color: 'white',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  captionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  captionUsername: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  caption: {
    color: 'white',
    flex: 1,
  },
  commentsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  viewAllComments: {
    color: '#888',
    marginBottom: 5,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  commentUsername: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  commentText: {
    color: 'white',
    flex: 1,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 10,
  },
  commentInput: {
    flex: 1,
    color: 'white',
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  postCommentButton: {
    backgroundColor: '#00bfff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  disabledCommentButton: {
    opacity: 0.5,
  },
  postCommentText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
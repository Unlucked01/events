'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd,
  PersonRemove,
  Clear,
} from '@mui/icons-material';
import Navigation from '@/components/Navigation';
import { subscriptionsService, authService } from '@/lib/api';
import { User } from '@/lib/api/auth';
import { resolveImageUrl } from '@/lib/utils/image';

export default function SubscriptionsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [followingIds, setFollowingIds] = useState<number[]>([]);

  useEffect(() => {
    // Load the current user and their subscriptions
    const loadUserData = async () => {
      setLoading(true);
      try {
        // Get current user
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        // Load followers
        const followersData = await subscriptionsService.getFollowers(user.id);
        
        // API returns an array directly, not a paginated response with 'items'
        const followersList = Array.isArray(followersData) 
          ? followersData.map(subscription => subscription.follower)
          : followersData.items 
            ? followersData.items.map(subscription => subscription.follower)
            : [];
        setFollowers(followersList);
        
        // Load following
        const followingData = await subscriptionsService.getFollowing(user.id);
        
        // API returns an array directly, not a paginated response with 'items'
        const followingList = Array.isArray(followingData)
          ? followingData.map(subscription => subscription.followed)
          : followingData.items
            ? followingData.items.map(subscription => subscription.followed)
            : [];
        setFollowing(followingList);
        
        // Extract following IDs for easy checking
        setFollowingIds(followingList.map(user => user.id));
      } catch (error) {
        console.error("Error loading subscriptions data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const results = await subscriptionsService.searchUsers({ query: term });
      // Handle both array and paginated responses
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else {
        setSearchResults(results.items || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const toggleFollow = async (userId: number) => {
    if (!currentUser) return;
    
    try {
      if (followingIds.includes(userId)) {
        // Unfollow user
        await subscriptionsService.unfollow(userId);
        setFollowingIds(prev => prev.filter(id => id !== userId));
        setFollowing(prev => prev.filter(user => user.id !== userId));
      } else {
        // Follow user
        const response = await subscriptionsService.follow(userId);
        setFollowingIds(prev => [...prev, userId]);
        
        // Find the user from search results or followers
        const userToAdd = searchResults.find(user => user.id === userId) || 
                         followers.find(user => user.id === userId);
        
        if (userToAdd) {
          setFollowing(prev => [...prev, userToAdd]);
        }
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    }
  };

  const renderUserList = (users: User[], emptyMessage: string) => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (users.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      );
    }
    
    return (
      <List>
        {users.map((user) => (
          <ListItem 
            key={user.id}
            secondaryAction={
              user.id !== currentUser?.id && (
                <IconButton 
                  edge="end" 
                  onClick={() => toggleFollow(user.id)}
                  color={followingIds.includes(user.id) ? "error" : "primary"}
                >
                  {followingIds.includes(user.id) ? <PersonRemove /> : <PersonAdd />}
                </IconButton>
              )
            }
            sx={{ py: 1.5 }}
          >
            <ListItemAvatar>
              <Avatar src={resolveImageUrl(user.profile_picture)} alt={user.full_name || ''} />
            </ListItemAvatar>
            <ListItemText 
              primary={user.full_name || 'Пользователь'}
              secondary={`@${user.username || ''}`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Navigation>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Управление подписками
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Находите интересных авторов и управляйте своими подписками
          </Typography>
        </Box>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
            }}
          >
            <Tab label={`Подписчики (${followers.length})`} />
            <Tab label={`Подписки (${following.length})`} />
            <Tab label="Поиск пользователей" />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Ваши подписчики
                </Typography>
                {renderUserList(followers, 'У вас пока нет подписчиков')}
              </>
            )}
            
            {tabValue === 1 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Вы подписаны
                </Typography>
                {renderUserList(following, 'Вы пока ни на кого не подписаны')}
              </>
            )}
            
            {tabValue === 2 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Поиск пользователей
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Поиск по имени или логину..."
                  value={searchTerm}
                  onChange={handleSearch}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={clearSearch} edge="end" size="small">
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Divider sx={{ mb: 2 }} />
                {searchTerm ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {searchLoading ? 'Поиск...' : `${searchResults.length} пользователей найдено`}
                    </Typography>
                    {searchLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      renderUserList(searchResults, 'Пользователи не найдены')
                    )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Введите имя или логин пользователя для поиска
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Navigation>
  );
} 
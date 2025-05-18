'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  CalendarMonth,
  AccessTime,
  LocationOn,
  People,
  Person,
  Phone,
} from '@mui/icons-material';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { profileService, authService, eventsService, subscriptionsService } from '@/lib/api';
import { User } from '@/lib/api/auth';
import { Event } from '@/lib/api/events';
import { resolveImageUrl } from '@/lib/utils/image';

export default function ProfilePage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phone: '',
    telegramUsername: '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch current user data
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }
        
        const user = await authService.getCurrentUser();
        setUserData(user);
        setFormData({
          username: user.username,
          fullName: user.full_name,
          phone: user.phone,
          telegramUsername: user.telegram_username || '',
        });
        
        // Fetch user events with proper pagination
        const eventsResponse = await eventsService.getUserEvents(user.id, {
          skip: 0,
          limit: 100
        });
        console.log('User Events API Response:', eventsResponse);
        console.log('User Events Items:', eventsResponse.items);
        console.log('User ID:', user.id);
        
        setUserEvents(eventsResponse.items || []);
        
        // Fetch followers and following with proper pagination
        const followersResponse = await subscriptionsService.getFollowers(user.id, {
          skip: 0,
          limit: 100
        });
        
        console.log('Followers response:', followersResponse);
        
        // Check the actual structure of the response to debug the issue
        console.log('Is array?', Array.isArray(followersResponse));
        
        // Cast response to any to safely check its structure
        const rawFollowersResponse = followersResponse as any;
        console.log('Direct array access test:', 
          rawFollowersResponse && Array.isArray(rawFollowersResponse) ? 
            [rawFollowersResponse[0], rawFollowersResponse[1]] : 'Not directly an array');
        
        // If the response is already an array (not in the expected items structure),
        // use it directly, otherwise try to access the items property
        let followerItems: Array<{id: number, follower: User, followed: User, created_at: string}> = [];
        if (Array.isArray(rawFollowersResponse)) {
          followerItems = rawFollowersResponse;
        } else if (rawFollowersResponse && typeof rawFollowersResponse === 'object' && Array.isArray(rawFollowersResponse.items)) {
          followerItems = rawFollowersResponse.items;
        }
        
        const followerUsers = followerItems.map(item => item.follower || {} as User);
        console.log('Extracted followers:', followerUsers);
        
        setFollowers(followerUsers);
        setFollowersCount(followerItems.length || 0);
        
        const followingResponse = await subscriptionsService.getFollowing(user.id, {
          skip: 0,
          limit: 100
        });
        
        console.log('Following response:', followingResponse);
        
        // Cast response to any to safely check its structure
        const rawFollowingResponse = followingResponse as any;
        
        // If the response is already an array (not in the expected items structure),
        // use it directly, otherwise try to access the items property
        let followingItems: Array<{id: number, follower: User, followed: User, created_at: string}> = [];
        if (Array.isArray(rawFollowingResponse)) {
          followingItems = rawFollowingResponse;
        } else if (rawFollowingResponse && typeof rawFollowingResponse === 'object' && Array.isArray(rawFollowingResponse.items)) {
          followingItems = rawFollowingResponse.items;
        }
        
        const followingUsers = followingItems.map(item => item.followed || {} as User);
        console.log('Extracted following:', followingUsers);
        
        setFollowing(followingUsers);
        setFollowingCount(followingItems.length || 0);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Не удалось загрузить данные профиля');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (isEditing && userData) {
      // Отмена изменений
      setFormData({
        username: userData.username,
        fullName: userData.full_name,
        phone: userData.phone,
        telegramUsername: userData.telegram_username || '',
      });
      setAvatarPreview(null);
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    try {
      if (userData) {
        // Update basic profile information
        await profileService.updateProfile({
          username: formData.username,
          full_name: formData.fullName,
          phone: formData.phone,
          telegram_username: formData.telegramUsername,
        });
        
        // Update avatar if a new one was selected
        if (avatar) {
          await profileService.updateProfilePicture(avatar);
        }
        
        // Refresh user data
        const updatedUser = await authService.getCurrentUser();
        setUserData(updatedUser);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Не удалось обновить профиль');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Navigation>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </Navigation>
    );
  }

  if (!userData) {
    return (
      <Navigation>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <Alert severity="error">Не удалось загрузить данные профиля</Alert>
        </Box>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Typography variant="h4" component="h1">
              Мой профиль
            </Typography>
            <Button
              variant="outlined"
              startIcon={isEditing ? <CloseIcon /> : <EditIcon />}
              onClick={handleEditToggle}
              disabled={submitting}
            >
              {isEditing ? 'Отменить' : 'Редактировать'}
            </Button>
          </Box>
          
          {isEditing ? (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={avatarPreview || (userData.profile_picture ? resolveImageUrl(userData.profile_picture) : undefined)}
                    alt={userData.full_name}
                    sx={{ width: 150, height: 150, mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    sx={{ mb: 1 }}
                    disabled={submitting}
                  >
                    Изменить фото
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatarChange}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Рекомендуемый размер: 300x300px
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        label="Имя пользователя"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        fullWidth
                        required
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <Person color="primary" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="ФИО"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        fullWidth
                        required
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <Person color="primary" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Телефон"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        fullWidth
                        required
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <Phone color="primary" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Telegram Username"
                        name="telegramUsername"
                        value={formData.telegramUsername}
                        onChange={handleChange}
                        fullWidth
                        required
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <Person color="primary" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                        sx={{ mt: 2 }}
                        disabled={submitting}
                      >
                        {submitting ? 'Сохранение...' : 'Сохранить изменения'}
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={userData.profile_picture ? resolveImageUrl(userData.profile_picture) : undefined}
                  alt={userData.full_name}
                  sx={{ width: 150, height: 150, mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  {userData.full_name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  @{userData.username}
                </Typography>
                <Divider sx={{ width: '100%', my: 2 }} />
                <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{followersCount}</Typography>
                    <Typography variant="body2" color="text.secondary">Подписчики</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{followingCount}</Typography>
                    <Typography variant="body2" color="text.secondary">Подписки</Typography>
                  </Box>
                </Stack>
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Телефон:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {userData.phone}
                  </Typography>
                  
                  {userData.telegram_username && (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                        Telegram:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        @{userData.telegram_username.replace('@', '')}
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  sx={{ mb: 3 }}
                >
                  <Tab label="Мои мероприятия" />
                  <Tab label="Подписчики" />
                  <Tab label="Подписки" />
                </Tabs>
                
                {/* Мои мероприятия */}
                {tabValue === 0 && (
                  <Grid container spacing={3}>
                    {userEvents.length > 0 ? (
                      userEvents.map((event) => (
                        <Grid item xs={12} sm={6} key={event.id}>
                          <Card
                            component={Link}
                            href={`/events/${event.id}`}
                            sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 12px 20px -10px rgba(0,0,0,0.2)',
                                textDecoration: 'none',
                              },
                            }}
                          >
                            <CardMedia
                              component="img"
                              height="140"
                              image={event.images && event.images[0] ? resolveImageUrl(event.images[0]) : "/event-placeholder.jpg"}
                              alt={event.title}
                              sx={{ objectFit: 'cover' }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" component="div" gutterBottom>
                                {event.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarMonth fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(event.event_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AccessTime fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(event.event_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {event.location}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography color="text.secondary" align="center">
                          У вас пока нет созданных мероприятий
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button
                            variant="contained"
                            component={Link}
                            href="/events/create"
                          >
                            Создать мероприятие
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
                
                {/* Подписчики */}
                {tabValue === 1 && (
                  <Grid container spacing={2}>
                    {followers.length > 0 ? (
                      followers.map((follower) => (
                        <Grid item xs={12} sm={6} md={4} key={follower.id || Math.random()}>
                          <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={follower.profile_picture ? resolveImageUrl(follower.profile_picture) : undefined} 
                                alt={follower.full_name || 'User'} 
                                sx={{ mr: 2 }} 
                              />
                              <Box>
                                <Typography variant="subtitle1">{follower.full_name || 'Unknown User'}</Typography>
                                <Typography variant="body2" color="text.secondary">@{follower.username || 'user'}</Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography color="text.secondary" align="center">
                          У вас пока нет подписчиков
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}
                
                {/* Подписки */}
                {tabValue === 2 && (
                  <Grid container spacing={2}>
                    {following.length > 0 ? (
                      following.map((follow) => (
                        <Grid item xs={12} sm={6} md={4} key={follow.id || Math.random()}>
                          <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={follow.profile_picture ? resolveImageUrl(follow.profile_picture) : undefined} 
                                alt={follow.full_name || 'User'} 
                                sx={{ mr: 2 }} 
                              />
                              <Box>
                                <Typography variant="subtitle1">{follow.full_name || 'Unknown User'}</Typography>
                                <Typography variant="body2" color="text.secondary">@{follow.username || 'user'}</Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography color="text.secondary" align="center">
                          Вы пока ни на кого не подписаны
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Paper>
      </Box>
    </Navigation>
  );
} 
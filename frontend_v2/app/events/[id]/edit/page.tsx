'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  IconButton,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { useParams, useRouter } from 'next/navigation';
import { subscriptionsService, eventsService, authService } from '@/lib/api';
import { User } from '@/lib/api/auth';
import { EventUpdateData, EventResponse } from '@/lib/api/events';
import { resolveImageUrl } from '@/lib/utils/image';

export default function EditEvent() {
  const params = useParams();
  const router = useRouter();
  const eventId = typeof params.id === 'string' ? parseInt(params.id, 10) : 0;
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [time, setTime] = useState<Dayjs | null>(dayjs().set('hour', 18).set('minute', 0));
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [invitedPeople, setInvitedPeople] = useState<number[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    title: false,
    date: false,
    time: false,
    location: false,
  });

  // Load event data and followers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const currentUser = await authService.getCurrentUser();
        setCurrentUserId(currentUser.id);
        
        // Get event data
        const eventData = await eventsService.getEvent(eventId);
        
        // Check if user is the event creator
        if (eventData.creator_id !== currentUser.id) {
          setError('У вас нет прав на редактирование этого мероприятия');
          return;
        }
        
        // Set form data from event
        setTitle(eventData.title);
        setDescription(eventData.description || '');
        setLocation(eventData.location);
        
        // Parse event date and time
        const eventDate = dayjs(eventData.event_date);
        setDate(eventDate);
        setTime(eventDate);
        
        // Set existing images
        setExistingImages(eventData.images || []);
        
        // Get followers for invitation options
        const followersResponse = await subscriptionsService.getFollowers(currentUser.id);
        
        // Extract follower users from subscription objects
        let followerUsers: User[] = [];
        if (Array.isArray(followersResponse)) {
          followerUsers = followersResponse.map(item => item.follower);
        } else if (followersResponse && typeof followersResponse === 'object' && Array.isArray(followersResponse.items)) {
          followerUsers = followersResponse.items.map(item => item.follower);
        }
        setFollowers(followerUsers);
        
        // Set invited people if available
        if (eventData.invitees && eventData.invitees.length > 0) {
          setInvitedPeople(eventData.invitees.map(user => user.id));
        }
        
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError('Не удалось загрузить данные мероприятия');
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Проверяем размер каждого файла (макс 10MB)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const invalidFiles = selectedFiles.filter(file => file.size > maxFileSize);
      
      if (invalidFiles.length > 0) {
        alert(`Следующие файлы слишком большие (максимум 10MB): ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }
      
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      
      setImages(prev => [...prev, ...selectedFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    newImages.splice(index, 1);
    URL.revokeObjectURL(previews[index]);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };
  
  const removeExistingImage = (index: number) => {
    const imageUrl = existingImages[index];
    
    // Add to list of removed images
    setRemovedImageUrls(prev => [...prev, imageUrl]);
    
    // Remove from existing images
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
  };

  const validateForm = () => {
    const newErrors = {
      title: title.trim() === '',
      date: !date,
      time: !time,
      location: location.trim() === '',
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Combine date and time
      const eventDateTime = date?.hour(time?.hour() || 0).minute(time?.minute() || 0);
      
      if (!eventDateTime) {
        throw new Error('Не указаны дата или время');
      }
      
      const eventData: EventUpdateData = {
        title,
        description,
        location,
        event_date: eventDateTime.toISOString(),
        invitees: invitedPeople,
        images: images,
        existing_images: existingImages,
      };
      
      await eventsService.updateEvent(eventId, eventData);
      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Ошибка при обновлении мероприятия:', error);
      setError('Не удалось обновить мероприятие. Пожалуйста, попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <Navigation>
        <Box sx={{ mt: 4, px: 2 }}>
          <Alert severity="error">{error}</Alert>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => router.push(`/events/${eventId}`)}
          >
            Вернуться к мероприятию
          </Button>
        </Box>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Редактирование мероприятия
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Название мероприятия */}
              <Grid item xs={12}>
                <TextField
                  label="Название мероприятия"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  required
                  error={errors.title}
                  helperText={errors.title && "Обязательное поле"}
                />
              </Grid>
              
              {/* Дата и время */}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Дата"
                    value={date}
                    onChange={(newDate) => setDate(newDate)}
                    sx={{ width: '100%' }}
                    slotProps={{
                      textField: {
                        error: errors.date,
                        helperText: errors.date ? "Обязательное поле" : "",
                        required: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Время"
                    value={time}
                    onChange={(newTime) => setTime(newTime)}
                    sx={{ width: '100%' }}
                    slotProps={{
                      textField: {
                        error: errors.time,
                        helperText: errors.time ? "Обязательное поле" : "",
                        required: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              {/* Место проведения */}
              <Grid item xs={12}>
                <TextField
                  label="Место проведения"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                  required
                  error={errors.location}
                  helperText={errors.location && "Обязательное поле"}
                />
              </Grid>
              
              {/* Описание */}
              <Grid item xs={12}>
                <TextField
                  label="Описание"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                />
              </Grid>
              
              {/* Существующие изображения */}
              {existingImages.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Текущие изображения
                  </Typography>
                  <Grid container spacing={2}>
                    {existingImages.map((image, index) => (
                      <Grid item key={`existing-${index}`}>
                        <Box sx={{ position: 'relative', width: 150, height: 150 }}>
                          <Image
                            src={resolveImageUrl(image)}
                            alt={`Event image ${index + 1}`}
                            fill
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            }}
                            onClick={() => removeExistingImage(index)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
              
              {/* Новые изображения */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Добавить новые изображения
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddIcon />}
                >
                  Добавить изображения
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    multiple
                    onChange={handleImageChange}
                  />
                </Button>
                
                {previews.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {previews.map((preview, index) => (
                      <Grid item key={index}>
                        <Box sx={{ position: 'relative', width: 150, height: 150 }}>
                          <Image
                            src={preview}
                            alt={`New preview ${index + 1}`}
                            fill
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            }}
                            onClick={() => removeImage(index)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
              
              {/* Приглашенные */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="invited-people-label">Приглашенные</InputLabel>
                  <Select
                    labelId="invited-people-label"
                    multiple
                    value={invitedPeople}
                    onChange={(e) => setInvitedPeople(e.target.value as number[])}
                    input={<OutlinedInput label="Приглашенные" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const follower = followers.find(f => f.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={follower ? follower.full_name : `User ${value}`} 
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {followers.map((follower) => (
                      <MenuItem key={follower.id} value={follower.id}>
                        <Checkbox checked={invitedPeople.indexOf(follower.id) > -1} />
                        <ListItemText primary={follower.full_name} secondary={`@${follower.username}`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Кнопки */}
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push(`/events/${eventId}`)}
                  disabled={submitting}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={24} /> : null}
                >
                  {submitting ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </Navigation>
  );
} 
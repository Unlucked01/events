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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';
import { subscriptionsService, eventsService, authService } from '@/lib/api';
import { User } from '@/lib/api/auth';
import { EventCreateData } from '@/lib/api/events';

export default function CreateEvent() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [time, setTime] = useState<Dayjs | null>(dayjs().set('hour', 18).set('minute', 0));
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [invitedPeople, setInvitedPeople] = useState<number[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [errors, setErrors] = useState({
    title: false,
    date: false,
    time: false,
    location: false,
  });

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Получаем текущего пользователя
        const currentUser = await authService.getCurrentUser();
        setCurrentUserId(currentUser.id);
        
        // Получаем подписчиков текущего пользователя
        const followersResponse = await subscriptionsService.getFollowers(currentUser.id);
        
        // Extract follower users from subscription objects
        let followerUsers: User[] = [];
        if (Array.isArray(followersResponse)) {
          // If the response is already an array
          followerUsers = followersResponse.map(item => item.follower);
        } else if (followersResponse && typeof followersResponse === 'object' && Array.isArray(followersResponse.items)) {
          // If the response has an items property
          followerUsers = followersResponse.items.map(item => item.follower);
        }
        
        setFollowers(followerUsers);
        
        // По умолчанию приглашаем всех подписчиков
        if (followerUsers.length > 0) {
          setInvitedPeople(followerUsers.map(f => f.id));
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
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
      // Комбинируем дату и время
      const eventDateTime = date?.hour(time?.hour() || 0).minute(time?.minute() || 0);
      
      if (!eventDateTime) {
        throw new Error('Не указаны дата или время');
      }
      
      const eventData: EventCreateData = {
        title,
        description,
        location,
        event_date: eventDateTime.toISOString(),
        invitees: invitedPeople,
        images: images,
      };
      
      await eventsService.createEvent(eventData);
      router.push('/events');
    } catch (error) {
      console.error('Ошибка при создании мероприятия:', error);
      alert('Не удалось создать мероприятие. Пожалуйста, попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Создание нового мероприятия
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
              
              {/* Изображения */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Изображения
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddIcon />}
                  >
                    Добавить изображение
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                      multiple
                    />
                  </Button>
                </Box>
                
                {previews.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {previews.map((preview, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'relative',
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                            },
                          }}
                          onClick={() => removeImage(index)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
              
              {/* Приглашения */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Приглашенные</InputLabel>
                  <Select
                    multiple
                    value={invitedPeople}
                    onChange={(e) => setInvitedPeople(e.target.value as number[])}
                    input={<OutlinedInput label="Приглашенные" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const user = followers.find(f => f.id === value);
                          return (
                            <Chip key={value} label={user?.full_name || user?.username || 'Пользователь'} />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {followers.length === 0 ? (
                      <MenuItem disabled>
                        <ListItemText primary="У вас нет подписчиков" />
                      </MenuItem>
                    ) : (
                      followers.map((follower) => (
                        <MenuItem key={follower.id} value={follower.id}>
                          <Checkbox checked={invitedPeople.indexOf(follower.id) > -1} />
                          <ListItemText primary={follower.full_name || follower.username} />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>Ваши подписчики, которых вы хотите пригласить</FormHelperText>
                </FormControl>
              </Grid>
              
              {/* Кнопки действий */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                  >
                    {submitting ? 'Создание...' : 'Создать мероприятие'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </Box>
  );
} 
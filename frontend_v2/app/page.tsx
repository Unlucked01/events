'use client';

import { Box, Typography, Paper, Grid, Button, Card, CardContent, CardMedia, Chip, Stack, CircularProgress } from '@mui/material';
import { CalendarMonth, AccessTime, LocationOn, People } from '@mui/icons-material';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { eventsService } from '@/lib/api';
import { Event } from '@/lib/api/events';

export default function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await eventsService.getEvents({ limit: 3 });
        setUpcomingEvents(response.items || []);
      } catch (error) {
        console.error('Ошибка при загрузке мероприятий:', error);
        setError('Не удалось загрузить мероприятия. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
          Добро пожаловать в EventHub
        </Typography>

        <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Создавайте и управляйте событиями с лёгкостью
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Платформа для организации мероприятий и встреч с вашим сообществом
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            component={Link} 
            href="/events/create"
            sx={{ fontWeight: 'bold' }}
          >
            Создать событие
          </Button>
        </Paper>

        <Typography variant="h5" sx={{ mb: 3 }}>
          Предстоящие мероприятия
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : upcomingEvents.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Нет предстоящих мероприятий</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {upcomingEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={event.images && event.images.length > 0 ? event.images[0] : "/event-placeholder.jpg"}
                    alt={event.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {event.title}
                    </Typography>
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonth fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(event.event_date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(event.event_date).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {event.location}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      component={Link} 
                      href={`/events/${event.id}`}
                    >
                      Подробнее
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            component={Link} 
            href="/events"
            sx={{ px: 4 }}
          >
            Все мероприятия
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Divider,
  Stack,
  Paper,
  Tabs,
  Tab,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarMonth,
  AccessTime,
  LocationOn,
  People,
  FilterList,
  Clear,
} from '@mui/icons-material';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { eventsService } from '@/lib/api';
import { Event, EventListParams } from '@/lib/api/events';
import { resolveImageUrl } from '@/lib/utils/image';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<EventListParams>({
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const skip = ((params.page || 1) - 1) * (params.limit || 10);
        const apiParams = {
          ...params,
          skip
        };
        
        let response;
        
        // Если есть поисковый запрос, всегда используем специальный endpoint для поиска
        if (params.search && params.search.trim().length >= 3) {
          const searchParams = { ...apiParams };
          delete searchParams.search; // Удаляем search из params, так как он передается отдельно
          response = await eventsService.searchEvents(params.search, searchParams);
        } else if (tabValue === 0) {
          // Для обычного списка событий убираем search параметр если он есть
          const regularParams = { ...apiParams };
          delete regularParams.search;
          response = await eventsService.getEvents(regularParams);
        } else {
          // Для ленты также убираем search параметр
          const feedParams = { ...apiParams };
          delete feedParams.search;
          response = await eventsService.getFeedEvents(feedParams);
        }
        
        setEvents(response.items);
      } catch (error) {
        console.error('Ошибка при загрузке мероприятий:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [tabValue, params]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    if (searchQuery.trim().length >= 3) {
      // При поиске переключаемся на вкладку "Все мероприятия"
      setTabValue(0);
      setParams(prev => ({ ...prev, search: searchQuery.trim() }));
    } else if (searchQuery.trim().length === 0) {
      // Если поисковый запрос пустой, очищаем поиск
      setParams(prev => {
        const newParams = { ...prev };
        delete newParams.search;
        return newParams;
      });
    }
    // Если запрос меньше 3 символов, ничего не делаем (можно добавить уведомление)
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setParams(prev => {
      const newParams = { ...prev };
      delete newParams.search;
      return newParams;
    });
  };

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setDateRange(value);
    
    const newParams = { ...params };
    delete newParams.from_date;
    delete newParams.to_date;
    
    const today = new Date();
    
    if (value === 'today') {
      newParams.from_date = today.toISOString().split('T')[0];
      newParams.to_date = today.toISOString().split('T')[0];
    } else if (value === 'week') {
      newParams.from_date = today.toISOString().split('T')[0];
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      newParams.to_date = nextWeek.toISOString().split('T')[0];
    } else if (value === 'month') {
      newParams.from_date = today.toISOString().split('T')[0];
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      newParams.to_date = nextMonth.toISOString().split('T')[0];
    }
    
    setParams(newParams);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // При переключении вкладок очищаем поиск, так как поиск работает только для "Все мероприятия"
    if (newValue === 1 && params.search) {
      setSearchQuery('');
      setParams(prev => {
        const newParams = { ...prev };
        delete newParams.search;
        return newParams;
      });
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>

        <Paper sx={{ mt: 6, mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab label="Все мероприятия" />
            <Tab label="Моя лента" />
          </Tabs>
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              placeholder="Поиск мероприятий..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              fullWidth
              size="small"
              helperText={searchQuery.length > 0 && searchQuery.length < 3 ? "Минимум 3 символа для поиска" : ""}
              error={searchQuery.length > 0 && searchQuery.length < 3}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              onClick={handleSearch}
              variant="contained"
              sx={{ minWidth: 'auto' }}
              disabled={searchQuery.length > 0 && searchQuery.length < 3}
            >
              Найти
            </Button>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterList />
            </IconButton>
          </Box>
          
          {showFilters && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 1.5 }} />
              <FormControl fullWidth size="small">
                <InputLabel>Временной период</InputLabel>
                <Select
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  input={<OutlinedInput label="Временной период" />}
                >
                  <MenuItem value="all">Все даты</MenuItem>
                  <MenuItem value="today">Сегодня</MenuItem>
                  <MenuItem value="week">Ближайшая неделя</MenuItem>
                  <MenuItem value="month">Ближайший месяц</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </Paper>

        {loading ? (
          <Typography sx={{ p: 3, textAlign: 'center' }}>Загрузка мероприятий...</Typography>
        ) : !events || events.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Мероприятия не найдены
            </Typography>
            <Typography color="text.secondary">
              {tabValue === 0 
                ? 'Попробуйте изменить параметры поиска или создайте новое мероприятие'
                : 'Подпишитесь на других пользователей, чтобы видеть их мероприятия'}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={event.images && event.images.length > 0 ? 
                      resolveImageUrl(event.images[0])
                      : "/event-placeholder.jpg"}
                    alt={event.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {event.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {event.description}
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
      </Box>
    </Box>
  );
} 
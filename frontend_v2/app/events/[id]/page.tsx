'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Rating,
  AvatarGroup,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CalendarMonth,
  AccessTime,
  LocationOn,
  People,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import { eventsService, commentsService, authService, reviewsService } from '@/lib/api';
import { EventResponse, ParticipantResponse } from '@/lib/api/events';
import { Comment, CommentCreateData } from '@/lib/api/comments';
import { User } from '@/lib/api/auth';
import { Review, ReviewCreateData } from '@/lib/api/reviews';
import { resolveImageUrl } from '@/lib/utils/image';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = typeof params.id === 'string' ? parseInt(params.id, 10) : 0;
  
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCurrentUserParticipant, setIsCurrentUserParticipant] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First try to get the current user
        let userData = null;
        try {
          userData = await authService.getCurrentUser();
          setCurrentUser(userData);
        } catch (userErr) {
          console.log('Not logged in or user data error:', userErr);
          // Continue with null currentUser
        }
        
        // Then try to get the event data
        const eventData = await eventsService.getEvent(eventId);
        setEvent(eventData);
        
        // Load participants
        try {
          const participantsData = await eventsService.getEventParticipants(eventId);
          console.log('Loaded participants:', participantsData);
          // Extract unique users to avoid duplicates
          const uniqueUsers = Array.from(
            new Map(participantsData.map(item => [item.user.id, item.user])).values()
          );
          setParticipants(uniqueUsers);
          console.log('Unique participants:', uniqueUsers);
          
          // Check if current user is a participant
          if (userData) {
            const isParticipant = participantsData.some(
              participant => participant.user.id === userData.id
            );
            setIsCurrentUserParticipant(isParticipant);
          }
        } catch (participantsErr) {
          console.error('Error loading participants:', participantsErr);
          setParticipants([]);
        }
        
        // Try to load comments
        try {
          const commentsData = await commentsService.getEventComments(eventId);
          // Handle both array responses and paginated responses with items property
          if (Array.isArray(commentsData)) {
            setComments(commentsData);
          } else {
            setComments(commentsData.items || []);
          }
        } catch (commentsErr) {
          console.error('Error loading comments:', commentsErr);
          setComments([]);
        }
        
        // Try to load reviews
        try {
          const reviewsData = await reviewsService.getEventReviews(eventId);
          setReviews(reviewsData.reviews || []);
          setAverageRating(reviewsData.average_rating || 0);
          
          // Check if the current user has already reviewed the event
          if (userData && reviewsData.reviews) {
            const userReviewFound = reviewsData.reviews.find(
              review => review.user.id === userData.id
            );
            setHasUserReviewed(!!userReviewFound);
            if (userReviewFound) {
              setUserReview(userReviewFound);
            }
          }
        } catch (reviewsErr) {
          console.error('Error loading reviews:', reviewsErr);
          setReviews([]);
          setAverageRating(0);
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить информацию о мероприятии');
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchData();
    }
  }, [eventId]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;
    
    setCommentLoading(true);
    
    try {
      const commentData: CommentCreateData = {
        text: userComment
      };
      
      const newComment = await commentsService.createComment(eventId, commentData);
      setComments(prev => [newComment, ...prev]);
      setUserComment('');
    } catch (err) {
      console.error('Ошибка при отправке комментария:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleParticipate = async () => {
    try {
      if (isCurrentUserParticipant) {
        await eventsService.leaveEvent(eventId);
        console.log('Successfully left event');
        
        // Instead of just removing the current user, reload all participants
        // This ensures we have the correct list from the server
        try {
          const updatedParticipants = await eventsService.getEventParticipants(eventId);
          const uniqueUsers = Array.from(
            new Map(updatedParticipants.map(item => [item.user.id, item.user])).values()
          );
          setParticipants(uniqueUsers);
        } catch (err) {
          console.error('Error reloading participants after leaving:', err);
          // Fallback to just removing current user
          if (currentUser) {
            setParticipants(prev => prev.filter(p => p.id !== currentUser.id));
          }
        }
      } else {
        await eventsService.joinEvent(eventId);
        console.log('Successfully joined event');
        
        // Instead of just adding the current user, reload all participants
        try {
          const updatedParticipants = await eventsService.getEventParticipants(eventId);
          const uniqueUsers = Array.from(
            new Map(updatedParticipants.map(item => [item.user.id, item.user])).values()
          );
          setParticipants(uniqueUsers);
        } catch (err) {
          console.error('Error reloading participants after joining:', err);
          // Fallback to just adding current user
          if (currentUser) {
            setParticipants(prev => [...prev, currentUser]);
          }
        }
      }
      
      // Update participation status
      setIsCurrentUserParticipant(!isCurrentUserParticipant);
    } catch (err) {
      console.error('Ошибка при изменении статуса участия:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Ссылка скопирована в буфер обмена');
  };

  const handleEdit = () => {
    router.push(`/events/${eventId}/edit`);
  };

  const handleDelete = async () => {
    if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      try {
        await eventsService.deleteEvent(eventId);
        router.push('/events');
      } catch (err) {
        console.error('Ошибка при удалении мероприятия:', err);
      }
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewRating) return;
    
    setReviewLoading(true);
    
    try {
      const reviewData: ReviewCreateData = {
        text: reviewText,
        rating: reviewRating
      };
      
      const newReview = await reviewsService.createReview(eventId, reviewData);
      
      // Reload reviews to get the updated list and average
      const reviewsData = await reviewsService.getEventReviews(eventId);
      setReviews(reviewsData.reviews || []);
      setAverageRating(reviewsData.average_rating || 0);
      
      // Update user review status
      setHasUserReviewed(true);
      setUserReview(newReview);
      
      // Close dialog and reset form
      setOpenReviewDialog(false);
      setReviewText('');
      setReviewRating(null);
    } catch (err) {
      console.error('Ошибка при отправке отзыва:', err);
      alert('Не удалось отправить отзыв. Возможно, мероприятие еще не прошло или вы уже оставили отзыв.');
    } finally {
      setReviewLoading(false);
    }
  };
  
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
    
    try {
      await reviewsService.deleteReview(reviewId);
      
      // Reload reviews
      const reviewsData = await reviewsService.getEventReviews(eventId);
      setReviews(reviewsData.reviews || []);
      setAverageRating(reviewsData.average_rating || 0);
      
      // Update user review status
      setHasUserReviewed(false);
      setUserReview(null);
    } catch (err) {
      console.error('Ошибка при удалении отзыва:', err);
      alert('Не удалось удалить отзыв');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Navigation />
        <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }
  
  if (error || !event) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Navigation />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              {error || 'Мероприятие не найдено'}
            </Typography>
            <Button variant="contained" onClick={() => router.push('/events')}>
              Вернуться к списку мероприятий
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Заголовок и действия */}
        <Box sx={{ mt: 6, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {event.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<ShareIcon />}
              onClick={handleShare}
            >
              Поделиться
            </Button>
            {currentUser && event.creator_id === currentUser.id && (
              <>
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Редактировать
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Удалить
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {/* Информация о мероприятии */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Карусель изображений */}
            <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
              <Box sx={{ position: 'relative', height: 400 }}>
                {event.images && event.images.length > 0 ? (
                  <Image
                    src={resolveImageUrl(event.images[0])}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.200' 
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      Нет изображений
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Основная информация */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stack spacing={2}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.description}
                </Typography>

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonth color="primary" />
                        <Typography>
                          {new Date(event.event_date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime color="primary" />
                        <Typography>
                          {new Date(event.event_date).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn color="primary" />
                        <Typography>
                          {event.location}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People color="primary" />
                        <Typography>
                          {participants.length} участников
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    src={resolveImageUrl(event.creator?.profile_picture)}
                    alt={event.creator && event.creator.full_name ? event.creator.full_name : 'Организатор'}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box>
                    <Typography variant="body2">Организатор</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {event.creator && event.creator.full_name ? event.creator.full_name : 'Неизвестный автор'}
                    </Typography>
                  </Box>
                </Box>

                {currentUser && (
                  <Button 
                    variant={isCurrentUserParticipant ? "outlined" : "contained"} 
                    color={isCurrentUserParticipant ? "error" : "primary"}
                    startIcon={isCurrentUserParticipant ? <CancelIcon /> : <CheckCircleIcon />}
                    onClick={handleParticipate}
                    fullWidth
                  >
                    {isCurrentUserParticipant ? 'Отказаться от участия' : 'Принять участие'}
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Вкладки комментариев/отзывов */}
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Комментарии" />
                <Tab label="Отзывы" />
              </Tabs>
              
              {/* Комментарии */}
              {tabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  {currentUser && (
                    <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3, display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder="Напишите комментарий..."
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                      <IconButton 
                        type="submit" 
                        color="primary" 
                        disabled={!userComment.trim() || commentLoading}
                      >
                        {commentLoading ? <CircularProgress size={24} /> : <SendIcon />}
                      </IconButton>
                    </Box>
                  )}
                  
                  <List>
                    {comments.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                        Пока нет комментариев. Будьте первым!
                      </Typography>
                    ) : (
                      comments.map((comment) => (
                        <React.Fragment key={comment.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar src={resolveImageUrl(comment.user?.profile_picture)} alt={comment.user?.full_name || 'User'} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography fontWeight="bold">
                                    {comment.user?.full_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              }
                              secondary={comment.text}
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </Box>
              )}
              
              {/* Отзывы */}
              {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  {event?.is_finished && currentUser && !hasUserReviewed && (
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="contained" 
                        startIcon={<StarIcon />}
                        onClick={() => setOpenReviewDialog(true)}
                      >
                        Оставить отзыв
                      </Button>
                    </Box>
                  )}
                  
                  {!event?.is_finished && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      Отзывы будут доступны после завершения мероприятия
                    </Typography>
                  )}
                  
                  {event?.is_finished && reviews.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      Пока нет отзывов. Будьте первым!
                    </Typography>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ mr: 2 }}>
                          Средний рейтинг:
                        </Typography>
                        <Rating 
                          value={averageRating} 
                          precision={0.5} 
                          readOnly 
                          size="large" 
                        />
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          ({averageRating.toFixed(1)})
                        </Typography>
                      </Box>
                      
                      <List>
                        {reviews.map((review) => (
                          <React.Fragment key={review.id}>
                            <ListItem 
                              alignItems="flex-start"
                              secondaryAction={
                                currentUser && currentUser.id === review.user.id && (
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete"
                                    onClick={() => handleDeleteReview(review.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                )
                              }
                            >
                              <ListItemAvatar>
                                <Avatar 
                                  src={resolveImageUrl(review.user?.profile_picture)} 
                                  alt={review.user?.full_name || 'User'} 
                                />
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography fontWeight="bold">
                                      {review.user?.full_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Rating value={review.rating} precision={0.5} readOnly />
                                    {review.text && (
                                      <Typography 
                                        variant="body2" 
                                        sx={{ mt: 1 }}
                                      >
                                        {review.text}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                            <Divider variant="inset" component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Сайдбар с участниками */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Участники ({participants.length})
              </Typography>
              
              {participants.length > 0 ? (
                <>
                  <AvatarGroup max={10} sx={{ mb: 2, justifyContent: 'flex-start' }}>
                    {participants.map((participant) => (
                      <Avatar 
                        key={participant.id} 
                        src={participant.profile_picture ? resolveImageUrl(participant.profile_picture) : ''}
                        alt={participant.full_name || 'Участник'}
                      />
                    ))}
                  </AvatarGroup>
                  
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {participants.map((participant) => (
                      <ListItem key={participant.id}>
                        <ListItemAvatar>
                          <Avatar 
                            src={participant.profile_picture ? resolveImageUrl(participant.profile_picture) : ''}
                            alt={participant.full_name || 'Участник'} 
                          />
                        </ListItemAvatar>
                        <ListItemText 
                          primary={participant.full_name || 'Участник'}
                          secondary={participant.username || ''}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Пока никто не присоединился
                </Typography>
              )}
            </Paper>
            
            {event.invitees && event.invitees.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Приглашены ({event.invitees.length})
                </Typography>
                
                <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {event.invitees?.map((invitee) => (
                    <ListItem key={invitee?.id || Math.random()}>
                      <ListItemAvatar>
                        <Avatar 
                          src={resolveImageUrl(invitee?.profile_picture)}
                          alt={invitee?.full_name || 'Приглашенный'}
                        />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={invitee?.full_name || 'Приглашенный'}
                        secondary={invitee?.username || ''}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
      
      {/* Review Dialog */}
      <Dialog 
        open={openReviewDialog} 
        onClose={() => setOpenReviewDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Оставить отзыв</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Ваша оценка:
              </Typography>
              <Rating
                name="review-rating"
                value={reviewRating}
                onChange={(event, newValue) => {
                  setReviewRating(newValue);
                }}
                size="large"
              />
            </Box>
            
            <TextField
              label="Комментарий (необязательно)"
              multiline
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleReviewSubmit} 
            variant="contained" 
            disabled={!reviewRating || reviewLoading}
          >
            {reviewLoading ? <CircularProgress size={24} /> : 'Отправить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
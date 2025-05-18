'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link as MuiLink,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    username: false,
    password: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear errors when typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: false,
      });
    }
    
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      username: formData.username.trim() === '',
      password: formData.password.trim() === '',
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await authService.login({
        username: formData.username,
        password: formData.password
      });
      
      if (response && response.access_token) {
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Неверное имя пользователя или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Вход в систему
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Введите данные для доступа к платформе
          </Typography>
        </Box>
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Имя пользователя"
            variant="outlined"
            fullWidth
            required
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            helperText={errors.username ? 'Введите имя пользователя' : ''}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="primary" />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            label="Пароль"
            variant="outlined"
            fullWidth
            required
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            helperText={errors.password ? 'Введите пароль' : ''}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mb: 3, py: 1.5 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
          </Button>
          
          <Grid container justifyContent="center">
            <Grid item>
              <Typography variant="body2">
                Нет аккаунта?{' '}
                <MuiLink
                  component={Link}
                  href="/auth/register"
                  fontWeight="medium"
                  underline="hover"
                >
                  Зарегистрироваться
                </MuiLink>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
} 
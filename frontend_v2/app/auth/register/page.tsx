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
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Lock,
  Phone,
  Visibility,
  VisibilityOff,
  AccountCircle,
  ArrowBack,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phone: '',
    telegramUsername: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    username: false,
    fullName: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });
  const [errorMessages, setErrorMessages] = useState({
    username: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ['Учетные данные', 'Личная информация', 'Завершение'];

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
      setErrorMessages({
        ...errorMessages,
        [name]: '',
      });
    }
    
    if (formError) {
      setFormError(null);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateStep = (step: number): boolean => {
    let isValid = true;
    const newErrors = { ...errors };
    const newErrorMessages = { ...errorMessages };
    
    if (step === 0) {
      // Validate username and password
      if (formData.username.trim() === '') {
        newErrors.username = true;
        newErrorMessages.username = 'Введите имя пользователя';
        isValid = false;
      } else if (formData.username.length < 3) {
        newErrors.username = true;
        newErrorMessages.username = 'Имя пользователя должно содержать минимум 3 символа';
        isValid = false;
      }
      
      if (formData.password.trim() === '') {
        newErrors.password = true;
        newErrorMessages.password = 'Введите пароль';
        isValid = false;
      } else if (formData.password.length < 6) {
        newErrors.password = true;
        newErrorMessages.password = 'Пароль должен содержать минимум 6 символов';
        isValid = false;
      }
      
      if (formData.confirmPassword.trim() === '') {
        newErrors.confirmPassword = true;
        newErrorMessages.confirmPassword = 'Повторите пароль';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = true;
        newErrorMessages.confirmPassword = 'Пароли не совпадают';
        isValid = false;
      }
    } else if (step === 1) {
      // Validate full name and phone
      if (formData.fullName.trim() === '') {
        newErrors.fullName = true;
        newErrorMessages.fullName = 'Введите ФИО';
        isValid = false;
      }
      
      if (formData.phone.trim() === '') {
        newErrors.phone = true;
        newErrorMessages.phone = 'Введите номер телефона';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    setErrorMessages(newErrorMessages);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      await authService.register({
        username: formData.username,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        telegram_username: formData.telegramUsername || undefined
      });
      
      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      setFormError('Ошибка при регистрации. Пожалуйста, попробуйте еще раз.');
      setActiveStep(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              label="Имя пользователя"
              variant="outlined"
              fullWidth
              required
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              helperText={errorMessages.username}
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
              helperText={errorMessages.password}
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
            
            <TextField
              label="Подтверждение пароля"
              variant="outlined"
              fullWidth
              required
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              helperText={errorMessages.confirmPassword}
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
          </>
        );
      case 1:
        return (
          <>
            <TextField
              label="ФИО"
              variant="outlined"
              fullWidth
              required
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              helperText={errorMessages.fullName}
              placeholder="Иванов Иван Иванович"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Телефон"
              variant="outlined"
              fullWidth
              required
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              helperText={errorMessages.phone}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Telegram Username (необязательно)"
              variant="outlined"
              fullWidth
              name="telegramUsername"
              value={formData.telegramUsername}
              onChange={handleChange}
              sx={{ mb: 3 }}
              placeholder="@username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Проверьте данные
            </Typography>
            <Typography variant="body1" paragraph>
              Имя пользователя: <strong>{formData.username}</strong>
            </Typography>
            <Typography variant="body1" paragraph>
              ФИО: <strong>{formData.fullName}</strong>
            </Typography>
            <Typography variant="body1" paragraph>
              Телефон: <strong>{formData.phone}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Нажмите "Зарегистрироваться" для создания аккаунта
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const renderStepActions = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0 || isSubmitting}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Назад
        </Button>
        
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}
          type={activeStep === steps.length - 1 ? 'submit' : 'button'}
          disabled={isSubmitting}
        >
          {activeStep === steps.length - 1 
            ? (isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Зарегистрироваться') 
            : 'Далее'}
        </Button>
      </Box>
    );
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
          maxWidth: 600,
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Регистрация
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Создайте аккаунт для доступа к платформе
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}
          {renderStepActions()}
          
          {activeStep === 0 && (
            <Grid container justifyContent="center" sx={{ mt: 3 }}>
              <Grid item>
                <Typography variant="body2">
                  Уже есть аккаунт?{' '}
                  <MuiLink
                    component={Link}
                    href="/auth/login"
                    fontWeight="medium"
                    underline="hover"
                  >
                    Войти
                  </MuiLink>
                </Typography>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
} 
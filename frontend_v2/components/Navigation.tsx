'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Dashboard,
  Notifications,
  Login as LoginIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { authService } from '@/lib/api';
import { User } from '@/lib/api/auth';
import UserAvatar from './UserAvatar';

const drawerWidth = 240;

interface NavigationProps {
  children?: ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Проверяем авторизацию
    const checkAuth = async () => {
      setLoading(true);
      try {
        const isAuth = authService.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        if (isAuth) {
          try {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
          } catch (err) {
            console.error('Ошибка при получении данных пользователя:', err);
            // Если не удалось получить данные пользователя, считаем что не авторизован
            authService.logout();
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Ошибка при проверке авторизации:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    router.push('/auth/login');
    handleProfileMenuClose();
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {isAuthenticated && currentUser ? (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <UserAvatar
            sx={{ 
              width: 80, 
              height: 80, 
              mb: 2,
            }}
            src={currentUser.profile_picture}
            name={currentUser.full_name}
            userId={currentUser.id}
          />
          <Typography variant="subtitle1" noWrap component="div" fontWeight="bold">
            {currentUser.full_name || currentUser.username}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6" component={Link} href="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            EventHub
          </Typography>
        </Box>
      )}
      
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            href="/"
            selected={isActive('/')}
          >
            <ListItemIcon>
              <Dashboard />
            </ListItemIcon>
            <ListItemText primary="Главная" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            component={Link}
            href="/events"
            selected={isActive('/events')}
          >
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Мероприятия" />
          </ListItemButton>
        </ListItem>
        
        {isAuthenticated && (
          <ListItem disablePadding>
            <ListItemButton 
              component={Link}
              href="/subscriptions"
              selected={isActive('/subscriptions')}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Подписки" />
            </ListItemButton>
          </ListItem>
        )}
        
        {isAuthenticated && (
          <ListItem disablePadding>
            <ListItemButton 
              component={Link}
              href="/profile"
              selected={isActive('/profile')}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Профиль" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2 }}>
        {isAuthenticated ? (
          <>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              sx={{ mb: 2 }}
              component={Link}
              href="/events/create"
            >
              Создать мероприятие
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LogoutIcon />}
              color="error"
              onClick={handleLogout}
            >
              Выйти
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            fullWidth
            startIcon={<LoginIcon />}
            component={Link}
            href="/auth/login"
          >
            Войти
          </Button>
        )}
      </Box>
    </Box>
  );

  const container = typeof window !== 'undefined' ? window.document.body : undefined;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {isAuthenticated ? (
            <>
              <IconButton color="inherit">
                <Notifications />
              </IconButton>
              
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <UserAvatar 
                  sx={{ width: 32, height: 32 }}
                  src={currentUser?.profile_picture}
                  name={currentUser?.full_name}
                  userId={currentUser?.id}
                />
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem component={Link} href="/profile" onClick={handleProfileMenuClose}>Мой профиль</MenuItem>
                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              color="inherit" 
              component={Link} 
              href="/auth/login"
              startIcon={<LoginIcon />}
            >
              Войти
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: ['56px', '64px'],
        }}
      >
        {children}
      </Box>
    </Box>
  );
} 
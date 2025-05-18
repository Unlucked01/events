import { createTheme } from '@mui/material/styles';
import { ruRU } from '@mui/material/locale';

// Расширяем типы для пользовательской палитры
declare module '@mui/material/styles' {
  interface Palette {
    customGrey: {
      light: string;
      main: string;
      dark: string;
    };
  }
  interface PaletteOptions {
    customGrey?: {
      light: string;
      main: string;
      dark: string;
    };
  }
}

const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#3f51b5',
        light: '#757de8',
        dark: '#002984',
      },
      secondary: {
        main: '#f50057',
        light: '#ff4081',
        dark: '#c51162',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
      customGrey: {
        light: '#f5f5f5',
        main: '#9e9e9e',
        dark: '#616161',
      },
    },
    typography: {
      fontFamily: [
        'Roboto',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
        letterSpacing: '-0.01562em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
        letterSpacing: '-0.00833em',
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
        letterSpacing: '0em',
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
        letterSpacing: '0.00735em',
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        letterSpacing: '0em',
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        letterSpacing: '0.0075em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1)',
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  },
  ruRU, // Русская локализация для компонентов
);

export default theme; 
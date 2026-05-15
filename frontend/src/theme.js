import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f766e' },
    secondary: { main: '#b45309' },
    background: {
      default: '#f4f1ea',
      paper: '#ffffff',
    },
    text: {
      primary: '#102a43',
      secondary: '#486581',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, Segoe UI, sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
});

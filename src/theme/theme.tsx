import { createTheme, alpha } from '@mui/material/styles'; 

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1366ff', 
      light: '#4d8cff',
      dark: '#0046c7',
    },
    secondary: {
      main: '#00b074',       
    },
    error: {
      main: '#ff334b',     
      light: '#ff667a',      
    },
    background: {
      default: '#141820',   
      paper: '#1d222c',      
    },
    text: {
      primary: '#f5f7fa',    
      secondary: '#95a1bb',  
    },
    divider: '#303b4e',      
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: '#141820' }, 
          '&::-webkit-scrollbar-thumb': { background: '#303b4e', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#45546f' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #303b4e',
          boxShadow: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #252f3f',
          padding: '12px 16px',
        },
        head: {
          backgroundColor: '#161b22',        
          color: '#95a1bb',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.8px',
          borderBottom: '2px solid #303b4e',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid #303b4e',
          borderRadius: 8,
          backgroundColor: '#1d222c',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1d222c',
          border: '1px solid #45546f',
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#303b4e',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4d8cff',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    
    MuiAlert: {
      styleOverrides: {
        // Intercettiamo la variante standard con severity='error'
        filledError: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.error.main, 0.15),
          color: theme.palette.error.light,
          border: `1px solid ${theme.palette.error.main}`,
          fontWeight: 500,
          '& .MuiAlert-icon': {
            color: theme.palette.error.light,
          },
        }),
       
        standardError: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.error.main, 0.15),
          color: theme.palette.error.light,
          border: `1px solid ${theme.palette.error.main}`,
          fontWeight: 500,
          '& .MuiAlert-icon': {
            color: theme.palette.error.light,
          },
        }),
      },
    },
  },
});
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import { darkTheme } from './theme/theme.tsx';
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

createRoot(document.getElementById('root')!).render(
 
 <ThemeProvider theme={darkTheme}>
   <CssBaseline />
    <App />
    </ThemeProvider>
 
)
   
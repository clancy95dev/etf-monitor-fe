import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



export default defineConfig(({}) => {

  return {
   
    plugins: [react()],
    base: '/etf-monitor-fe/',
    server: {
      port: 5173,
      host: true,
     
    },
  };
});
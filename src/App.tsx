import { EtfPage } from "./pages/etfPage";
import { BrowserRouter as Router, Route, Routes,Navigate } from "react-router-dom";
import { MuiNavbar } from "./components/MuiNavbar";
import {EtfDetail} from "./pages/etf-detail";
import {Registration} from "./pages/registration";
import {useState,createContext} from 'react';
import {Login} from './pages/login';
import {EditAlert} from './pages/editAlert';
import {Activation} from './pages/account-activation'
import {Watchlist} from './pages/watchlist';
import {UserProfile} from './pages/profile';
import {ChangePassword} from './pages/new-password';
import { MuiFooter } from "./components/MuiFooter";

import { Box } from '@mui/material';


export const AppContext=createContext<any>({});

function App() {


  const [userData,setUserData]=useState(null);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);


return (
    <AppContext.Provider value={{ userData, setUserData, isCheckingAuth, setIsCheckingAuth }}>
      <Router basename="/etf-monitor-fe">
        
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh' 
          }}
        >
          <MuiNavbar />
          
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              
              <Route path="/" element={<Navigate to="/etf" replace />} />
              <Route path="/etf" element={<EtfPage />} />
              <Route path="/etf/:id" element={<EtfDetail />} />
              <Route path="/registration" element={<Registration />} />
              <Route path="/login" element={<Login />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/alert/:id" element={<EditAlert />} />
              <Route path="/activation" element={<Activation />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Routes>
          </Box>

          <MuiFooter /> 
        </Box>
      </Router>
    </AppContext.Provider>
  );
}


export default App;

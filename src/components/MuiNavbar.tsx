import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Stack, 
  Button, 
  MenuItem, 
  Box, 
  Menu, 
  IconButton,
  CircularProgress,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { AccountCircle, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import { useContext, useState, useEffect } from "react";
import axios from 'axios';

export const MuiNavbar = () => {
  const { userData, setUserData, isCheckingAuth, setIsCheckingAuth } = useContext(AppContext);
  const navigate = useNavigate();
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [navAnchorEl, setNavAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const restoreSession = async () => {
      const savedRefreshToken = localStorage.getItem("refreshToken");

      if (!userData && savedRefreshToken) {
        try {
          const response = await axios.post(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/refresh-token", {
            token: savedRefreshToken 
          },{ headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } });

          const newAccessToken = response.data.token;
          const newRefreshToken = response.data.refreshToken;

          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          setUserData({ jwtToken: newAccessToken });
        } catch (error) {
          console.error("Refresh token scaduto o rimosso dal DB. Pulisco la sessione.");
          localStorage.clear();
        }
      }
      setIsCheckingAuth(false); 
    };

    restoreSession();
  }, []);

  const toHomepage = () => {
    navigate("/etf");
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNavAnchorEl(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    setNavAnchorEl(null);
  };

  const showProfile = () => {
    handleClose();
    navigate("/profile");
  };

  const handleLogout = async (isRetry = false) => {
    setAnchorEl(null);
    const config = { headers: { "Authorization": "Bearer " + userData?.jwtToken } };

    try {
      await axios.post(import.meta.env.VITE_API_URL+"/api/v1/users/logout", null, config);
    } catch (error: any) {
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/refresh-token", {
            refreshToken: currentRefreshToken
          },{ headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } });

          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }
          setUserData({ ...userData, jwtToken: newAccessToken });
          await handleLogout(true); 
          return;
        } catch (refreshError) {
          console.error("Anche il refresh token è scaduto.");
        }
      }
    } finally {
      if (!isRetry) {
        setUserData(null);
        localStorage.clear();
        navigate("/etf");
      }
    }
  };

  const isAuthenticated = userData != null && userData.jwtToken != null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" color="default" elevation={2} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          
          <Stack direction="row" alignItems="center" spacing={1}>
            
            {isMobile && isAuthenticated && (
              <>
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleNavMenu}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar-links"
                  anchorEl={navAnchorEl}
                  open={Boolean(navAnchorEl)}
                  onClose={handleNavMenuClose}
                  sx={{ display: { xs: 'block', md: 'none' } }}
                >
                  <MenuItem onClick={() => { handleNavMenuClose(); navigate("/watchlist"); }}>
                    Watchlist
                  </MenuItem>
                </Menu>
              </>
            )}

            <Typography
              variant="h6"
              component="div"
              sx={{ 
                fontWeight: 700, 
                letterSpacing: '.1rem', 
                color: 'primary.main', 
                cursor: "pointer",
                userSelect: 'none',
                '&:hover': { opacity: 0.8 }
              }}
              onClick={toHomepage}
            >
              ETF MONITOR
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            
            
            {!isMobile && isAuthenticated && (
              <Button 
                onClick={() => navigate("/watchlist")} 
                color="inherit" 
                sx={{ fontWeight: 600 }}
              >
                Watchlist
              </Button>
            )}

            {isCheckingAuth ? (
              <CircularProgress size={24} color="primary" />
            ) : !isAuthenticated ? ( 
              <Button 
                variant="contained" 
                color='primary' 
                onClick={() => navigate("/login")}
                sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}
              >
                Login
              </Button>
            ) : (
              
              <>
                <IconButton
                  size="large"
                  aria-label="account profile"
                  aria-controls="menu-profile"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="primary"
                  sx={{ p: 0.5 }}
                >
                  <AccountCircle fontSize="large" />
                </IconButton>
                <Menu 
                  id="menu-profile"
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  slotProps={{ paper: { sx: { mt: 1, minWidth: 150 } } }}
                >
                  <MenuItem onClick={showProfile}>Account</MenuItem>
                  <MenuItem onClick={() => handleLogout()} sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>

        </Toolbar>
      </AppBar>
    </Box>
  );
};
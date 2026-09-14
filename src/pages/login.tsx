import { useNavigate, useLocation } from "react-router-dom"; 
import { useContext, useState, useEffect } from "react";     
import { AppContext } from "../App";
import { 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Link, 
  Box, 
  Stack, 
  Alert, 
  CircularProgress,
  Container 
} from '@mui/material';
import axios from 'axios';

export const Login = () => {
  const { setUserData ,isCheckingAuth} = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation(); 

  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");

  const [isAccountInactive, setIsAccountInactive] = useState(false);

  useEffect(() => {

    if (isCheckingAuth) return;

      const token = localStorage.getItem("refreshToken");
      if (token) {
      
        navigate("/etf");
        return;
      }

    if (location.state?.passwordChangedSuccess) {
      console.log("password changed ok");
      setSuccessMsg("Password updated successfully! Please log in again with your new credentials.");
      window.history.replaceState({}, document.title);
    }
  }, [location,isCheckingAuth]);

  const handleEmailBlur = () => {
    if (!loginEmail) {
      setEmailError("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError("Password is required");
    }
  };

  const doSignIn = async () => {
    setLoading(true);
    setLoginError("");
    setIsAccountInactive(false); 
    const loginRequest = {
      email: loginEmail,
      password: password
    };

    axios.post(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/login", loginRequest,{ headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } })
      .then((response: any) => {
        setLoading(false);

        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }

        let userData = {
          jwtToken: response.data.token 
        };

        setUserData(userData);
        navigate("/etf"); 
      })
      .catch((error: any) => {
        setLoading(false);
        console.error("Login error:", error);

        if (error.response) {
          if (error.response.status === 403) {
            setIsAccountInactive(true);
            const backendMessage = error.response.data && typeof error.response.data === 'string'
              ? error.response.data
              : error.response.data?.message || "Account is not activated";
            setLoginError(backendMessage);
          } else {
            const backendMessage = typeof error.response.data === 'string' 
              ? error.response.data 
              : error.response.data?.message || "Invalid email or password.";
            setLoginError(backendMessage);
          }
        } else {
          setLoginError("Server communication error.");
        }
      });
  };

  const signIn = () => {
    let hasError = false;

    if (!loginEmail) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (!hasError) {
      doSignIn();
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: (theme) => `radial-gradient(circle at 50% 50%, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        p: 2 
      }}
    >
      
      <Container component="main" maxWidth="sm" disableGutters>
        <Paper 
          elevation={4} 
          sx={{ 
            
            px: { xs: 3, sm: 6, md: 8 }, 
          
            py: { xs: 4, sm: 6, md: 7 }, 
            width: '100%', 
            borderRadius: 5, 
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* Titolo più imponente e distanziato */}
          <Typography component="h1" variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}>
            Sign In
          </Typography>
          
          {successMsg && (
            <Stack sx={{ width: '100%', mb: 3 }}>
              <Alert severity="success" onClose={() => setSuccessMsg("")}>
                {successMsg}
              </Alert>
            </Stack>
          )}

          {loginError && (
            <Stack sx={{ width: '100%', mb: 3 }} spacing={2}>
              {isAccountInactive ? (
                <Alert severity='warning' onClose={() => { setLoginError(""); setIsAccountInactive(false); }}>
                  {loginError}.{" "}
                  <Link 
                    component="button" 
                    type="button" 
                    onClick={() => {
                      setUserData({ email: loginEmail, isFromLogin: true });
                      navigate("/activation");
                    }} 
                    sx={{ fontWeight: 'bold', color: 'warning.dark', textDecoration: 'underline', verticalAlign: 'baseline' }}
                  >
                    Verify your account here
                  </Link>
                </Alert>
              ) : (
                <Alert severity='error' onClose={() => setLoginError("")}>
                  {loginError}
                </Alert>
              )}
            </Stack>
          )}

          <Box component="form" noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              autoComplete="email"
              autoFocus
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onBlur={handleEmailBlur}
              onFocus={() => {
                setEmailError("");
                setSuccessMsg(""); 
              }} 
              error={!!emailError}
              helperText={emailError}
              disabled={loading}
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
              sx={{ mb: 3 }} 
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              onFocus={() => {
                setPasswordError("");
                setSuccessMsg(""); 
              }}
              error={!!passwordError}
              helperText={passwordError}
              disabled={loading}
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 4, mb: 2, p: 1.6, fontSize: '1.05rem', fontWeight: 'bold', borderRadius: 2.5 }}
              onClick={signIn}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Don't have an account?{" "}
                <Link 
                  component="button" 
                  type="button" 
                  onClick={() => navigate("/registration")} 
                  sx={{ fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem' }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
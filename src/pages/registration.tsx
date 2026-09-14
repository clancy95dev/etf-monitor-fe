import { useNavigate } from "react-router-dom";
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
  Container,
  Grid 
} from '@mui/material';
import axios from 'axios'; 
import { useState, useContext ,useEffect} from "react";

import { AppContext } from "../App"; 

export const Registration = () => {
  const navigate = useNavigate();

  const { setUserData,isCheckingAuth } = useContext(AppContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reEnterPassword, setReEnterPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [reEnterPasswordError, setReEnterPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  

    useEffect(() => {
      if (isCheckingAuth) return;
  
      const token = localStorage.getItem("refreshToken");
      if (token) {
      
        navigate("/etf");
        return;
      }
  
    }, [isCheckingAuth]);

  const handleEmailBlur = () => {
    if (!email) {
      setEmailError("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handleFirstNameBlur = () => {
    if (!firstName) setFirstNameError("First name is required");
  };

  const handleLastNameBlur = () => {
    if (!lastName) setLastNameError("Last name is required");
  };

  const handlePasswordBlur = () => {
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).+$/;

    if (!password) {
      setPasswordError("Password is required");
    } else if (password.length < 8 || password.length > 30) {
      setPasswordError("Password must be between 8 and 30 characters long");
    } else if (!passwordPattern.test(password)) {
      setPasswordError("Password must contain at least one letter, one number, and one special character (@$!%*#?&)");
    } else {
      setPasswordError("");
    }
  };

  const handleReEnterPasswordBlur = () => {
    if (password && reEnterPassword !== password) {
      setReEnterPasswordError("Passwords do not match");
    }
  };

  const checkRegistration = () => {
    let hasError = false;

    if (!email) { setEmailError("Email is required"); hasError = true; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Please enter a valid email address"); hasError = true; }

    if (!firstName) { setFirstNameError("First name is required"); hasError = true; }
    if (!lastName) { setLastNameError("Last name is required"); hasError = true; }
    
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).+$/;
    if (!password) { 
      setPasswordError("Password is required"); 
      hasError = true; 
    } else if (password.length < 8 || password.length > 30) { 
      setPasswordError("Password must be between 8 and 30 characters long"); 
      hasError = true; 
    } else if (!passwordPattern.test(password)) {
      setPasswordError("Password must contain at least one letter, one number, and one special character (@$!%*#?&)");
      hasError = true;
    }
    
    if (password !== reEnterPassword) {
      setReEnterPasswordError("Passwords do not match");
      hasError = true;
    }

    if (!hasError) {
      setRegistrationError("");
      doRegistration();
    } else {
      setRegistrationError("Please fix the errors in the form before submitting.");
    }
  };

  const doRegistration = async () => {
    setLoading(true);
    setRegistrationError("");

    const registrationRequest = { firstName, lastName, email, password };

    axios.post(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/register", registrationRequest,{ headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } })
      .then(() => {
        setLoading(false);
        console.log("email da memorizzare: " + email);
        setUserData({ email: email });
        navigate("/activation");
      })
      .catch((error: any) => {
        setLoading(false);
        if (error.response && error.response.data) {
          const backendMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || "Registration failed.";
          setRegistrationError(backendMessage);
        } else {
          setRegistrationError("Server communication error.");
        }
      });
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
            px: { xs: 3, sm: 6 }, 
            py: { xs: 4, sm: 6 }, 
            width: '100%', 
            borderRadius: 5, 
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography component="h1" variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}>
            Create account
          </Typography>
          
          {registrationError && (
            <Stack sx={{ width: '100%', mb: 3 }} spacing={2}>
              <Alert severity='error' onClose={() => setRegistrationError("")}>
                {registrationError}
              </Alert>
            </Stack>
          )}
          
        <Box component="form" noValidate>
            {/* Nelle versioni recenti di MUI si passa solo container, senza item */}
            <Grid container spacing={2}>
              
              {/* Email - si usa size={12} anziché xs={12} */}
              <Grid size={12}>
                <TextField
                  required fullWidth label="Email Address" autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  onFocus={() => setEmailError("")}
                  error={!!emailError}
                  helperText={emailError}
                  slotProps={{ input: { sx: { borderRadius: 2 } } }}
                />
              </Grid>
              
              {/* First Name */}
              <Grid size={12}>
                <TextField
                  required fullWidth label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={handleFirstNameBlur}
                  onFocus={() => setFirstNameError("")}
                  error={!!firstNameError}
                  helperText={firstNameError}
                  slotProps={{ input: { sx: { borderRadius: 2 } } }}
                />
              </Grid>
              
              {/* Last Name */}
              <Grid size={12}>
                <TextField
                  required fullWidth label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={handleLastNameBlur}
                  onFocus={() => setLastNameError("")}
                  error={!!lastNameError}
                  helperText={lastNameError}
                  slotProps={{ input: { sx: { borderRadius: 2 } } }}
                />
              </Grid>
              
              {/* Password */}
              <Grid size={12}>
                <TextField
                  required fullWidth label="Password" type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handlePasswordBlur}
                  onFocus={() => setPasswordError("")}
                  error={!!passwordError}
                  helperText={passwordError}
                  slotProps={{ input: { sx: { borderRadius: 2 } } }}
                />
              </Grid>
              
              {/* Re-enter Password */}
              <Grid size={12}>
                <TextField
                  required fullWidth label="Re-enter Password" type="password"
                  value={reEnterPassword}
                  onChange={(e) => setReEnterPassword(e.target.value)}
                  onBlur={handleReEnterPasswordBlur}
                  onFocus={() => setReEnterPasswordError("")}
                  error={!!reEnterPasswordError}
                  helperText={reEnterPasswordError}
                  slotProps={{ input: { sx: { borderRadius: 2 } } }}
                />
              </Grid>
            </Grid>

            <Button
              fullWidth variant="contained" color="primary" disabled={loading}
              sx={{ mt: 5, mb: 2, p: 1.6, fontSize: '1.05rem', fontWeight: 'bold', borderRadius: 2.5 }}
              onClick={checkRegistration}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Already have an account?{" "}
                <Link component="button" type="button" onClick={() => navigate("/login")} sx={{ fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
import { useNavigate } from "react-router-dom";
import { 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Box, 
  Stack, 
  Alert, 
  CircularProgress,
  Container,
  Link
} from '@mui/material';
import axios from 'axios';
import { useState, useContext, useEffect } from "react";
import { AppContext } from "../App"; 
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export const Activation = () => {
  const navigate = useNavigate();
  const { userData, setUserData,isCheckingAuth } = useContext(AppContext);

  const emailFromContext = userData?.email || "";
  const isFromLogin = userData?.isFromLogin || false; 

  const [email, setEmail] = useState(emailFromContext);
  const [activationCode, setActivationCode] = useState("");

  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");

  const [loading, setLoading] = useState(false);
  const [activationCompleted, setActivationCompleted] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");

  useEffect(() => {

     if (isCheckingAuth) return;
  
      const token = localStorage.getItem("refreshToken");
      if (token) {
      
        navigate("/etf");
        return;
      }

    if (emailFromContext) {
      setEmail(emailFromContext);
    }
  }, [emailFromContext,isCheckingAuth]);

  const handleEmailBlur = () => {
    if (!email) {
      setEmailError("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is not valid");
    }
  };

  const handleCodeBlur = () => {
    if (!activationCode) {
      setCodeError("Confirmation code is required");
    } else if (activationCode.length !== 6) {
      setCodeError("Confirmation code must be 6 characters long");
    }
  };

  const handleResendCode = () => {
    if (!email) {
      setEmailError("Email is required to request a new code");
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is not valid");
      return;
    }

    setLoading(true);
    setGlobalError("");
    setResendSuccess("");

    axios.post(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/resend-activation", { email: email },{ headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } })
      .then(() => {
        setLoading(false);
        setResendSuccess("If the email address exists in our system, you will receive a new activation code shortly.");
        if (emailFromContext && isFromLogin) {
          setUserData({ email: email, isFromLogin: false });
        }
      })
      .catch((error: any) => {
        setLoading(false);
        if (error.response && error.response.data) {
          const backendMessage = typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data.message || "Error resending activation code.";
          setGlobalError(backendMessage);
        } else {
          setGlobalError("Server error during code request. Please try again.");
        }
      });
  };

  const handleActivate = () => {
    let hasError = false;

    if (!email) { setEmailError("Email is required"); hasError = true; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Email is not valid"); hasError = true; }

    if (!activationCode) { setCodeError("Confirmation code is required"); hasError = true; }
    else if (activationCode.length !== 6) { setCodeError("Confirmation code must be 6 characters long"); hasError = true; }

    if (hasError) {
      setGlobalError("Please fix the errors in the form before submitting.");
      return;
    }
    
    doActivation();
  };

  const doActivation = () => {
    setLoading(true);
    setGlobalError("");
    setResendSuccess("");

    const activationRequest = {
      code: activationCode,
      email: email
    };

    axios.post(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/activate", activationRequest,{ headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } })
      .then(() => {
        setActivationCompleted(true);
        setLoading(false);
        setUserData(null); 
      })
      .catch((error: any) => {
        setLoading(false);
        if (error.response && error.response.data) {
          const backendMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || "Invalid code or email.";
          setGlobalError(backendMessage);
        } else {
          setGlobalError("Server communication error. Please try again later.");
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          
          {!activationCompleted ? (
            <>
              {globalError && (
                <Stack sx={{ width: '100%', mb: 3 }} spacing={2}>
                  <Alert severity='error' onClose={() => setGlobalError("")}>
                    {globalError}
                  </Alert>
                </Stack>
              )}

              {resendSuccess && (
                <Stack sx={{ width: '100%', mb: 3 }} spacing={2}>
                  <Alert severity='success' onClose={() => setResendSuccess("")}>
                    {resendSuccess}
                  </Alert>
                </Stack>
              )}

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
                  Activate Account
                </Typography>
                
                <Box component="form" noValidate>
                  
                  {emailFromContext ? (
                    isFromLogin ? (
                      <Box sx={{ mb: 3, p: 2.5, bgcolor: 'action.selected', borderRadius: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                          Account activation required for:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2.5 }}>
                          {email}
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="medium" 
                          fullWidth 
                          disabled={loading}
                          onClick={handleResendCode}
                          sx={{ borderRadius: 2, fontWeight: 'bold', p: 1 }}
                        >
                          Request Activation Code
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ mb: 3, p: 2.5, bgcolor: 'action.selected', borderRadius: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                          We sent a 6-character code to:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {email}
                        </Typography>
                      </Box>
                    )
                  ) : (
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleEmailBlur}
                      onFocus={() => setEmailError("")}
                      error={!!emailError}
                      helperText={emailError}
                      disabled={loading}
                      slotProps={{ input: { sx: { borderRadius: 2 } } }}
                      sx={{ mb: 2 }}
                    />
                  )}
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Activation Code"
                    placeholder="6-character code"
                    autoFocus={!!emailFromContext && !isFromLogin} 
                    inputProps={{ maxLength: 6 }}
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    onBlur={handleCodeBlur}
                    onFocus={() => setCodeError("")}
                    error={!!codeError}
                    helperText={codeError}
                    disabled={loading || (isFromLogin && !resendSuccess)}
                    slotProps={{ input: { sx: { borderRadius: 2 } } }}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={loading || (isFromLogin && !resendSuccess)}
                    sx={{ mt: 4, mb: 2, p: 1.6, fontSize: '1.05rem', fontWeight: 'bold', borderRadius: 2.5 }}
                    onClick={handleActivate}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Account"}
                  </Button>

                  {!emailFromContext && (
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                      <Link
                        component="button"
                        type="button"
                        variant="body1"
                        disabled={loading}
                        onClick={handleResendCode}
                        sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        Didn't receive the code? Resend email
                      </Link>
                    </Box>
                  )}
                </Box>
              </Paper>
            </>
          ) : (
            
            <Paper 
              elevation={4} 
              sx={{ 
                px: { xs: 3, sm: 6 }, 
                py: { xs: 4, sm: 6 }, 
                width: '100%', 
                borderRadius: 5, 
                boxSizing: 'border-box',
                bgcolor: 'background.paper',
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 70 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                Account Activated!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.6 }}>
                Il tuo account è stato attivato con successo. Adesso puoi effettuare l'accesso con le tue credenziali.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={() => navigate("/login")}
                sx={{ p: 1.5, fontSize: '1.05rem', fontWeight: 'bold', borderRadius: 2.5 }}
              >
                Go to Login
              </Button>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
};
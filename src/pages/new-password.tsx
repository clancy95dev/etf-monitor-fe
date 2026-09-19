import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from "axios";

export const ChangePassword = () => {
  const { userData, setUserData, isCheckingAuth } = useContext(AppContext);
  const navigate = useNavigate();

 
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [passwordFormatError, setPasswordFormatError] = useState("");

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,30}$/;

  const forceGlobalLogout = () => {
    setUserData(null);
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {

    const token = localStorage.getItem("refreshToken");
    if (!token) {
      setUserData(null);
      navigate("/login");
      return;
    }


  }, [isCheckingAuth, userData]);

  const handlePasswordBlur = () => {
    if (!newPassword) {
      setPasswordFormatError(""); 
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setPasswordFormatError("Password must be between 8 and 30 characters long and contain at least one letter, one number, and one special character (@$!%*#?&).");    
    } else {
      setPasswordFormatError(""); 
    }
  };

  const handleSubmit = async (e: React.FormEvent, isRetry = false, passedToken?: string) => {

  const tokenToUse = passedToken || userData?.jwtToken;

    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!passwordRegex.test(newPassword)) {
      setErrorMsg("The new password does not meet the security requirements.");
      setPasswordFormatError("Password must contain at least one letter, one number, and one special character (@$!%*#?&).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("The new passwords do not match!");
      return;
    }

    if (!oldPassword || !newPassword) {
      setErrorMsg("All fields are required.");
      return;
    }

    setSaving(true);

    const config = {
      headers: { Authorization: "Bearer " + tokenToUse,'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json' }
    };

    const requestBody = {
      oldPassword,
      newPassword
    };

    try {
      await axios.patch(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/users/password", requestBody, config);
      
      setSuccessMsg("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFormatError("");

      setUserData(null);
      localStorage.clear();

      navigate("/login", { 
        state: { passwordChangedSuccess: true } 
      });

    } catch (error: any) {
      console.error("Error changing password:", error);

      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/refresh-token", {
            token: currentRefreshToken
          },{ headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } });

          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }

          setUserData({ ...userData, jwtToken: newAccessToken });

          setSaving(false);
          await handleSubmit(e, true,newAccessToken);
        } catch (refreshError) {
          forceGlobalLogout();
        }
      } else {
        const backendMessage = error.response?.data?.message || "Failed to change password. Please check your credentials.";
        setErrorMsg(backendMessage);
      }
    } finally {
      if (!isRetry) setSaving(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      sx={{ 
        width: { xs: "94%", sm: "80%", md: "50%", lg: "35%" }, 
        margin: "2rem auto", 
        padding: { xs: "1.5rem", sm: "2.5rem" },
        borderRadius: 2 
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate("/profile")}
          sx={{ mr: 2, fontWeight: "bold" }}
          size="small"
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", fontSize: { xs: "1.6rem", sm: "2rem" } }}>
          Change Password
        </Typography>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

      <Box component="form" onSubmit={(e) => handleSubmit(e, false)} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          name="oldPassword"
          label="Current Password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          disabled={saving}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onBlur={handlePasswordBlur} 
          error={Boolean(passwordFormatError)} 
          helperText={passwordFormatError} 
          disabled={saving}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={saving}
        />

        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate("/profile")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={saving || Boolean(passwordFormatError)} 
          >
            Update Password
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
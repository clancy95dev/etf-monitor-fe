import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import {
  Paper,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import axios from "axios";

export const UserProfile = () => {
  const { userData, setUserData, isCheckingAuth } = useContext(AppContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mailNotifications, setMailNotifications] = useState(false);
  const [appNotifications, setAppNotifications] = useState(false);

  const [profileBackup, setProfileBackup] = useState<any>(null);
  const [isEditable, setIsEditable] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
    if (isCheckingAuth) return;

    const token = localStorage.getItem("refreshToken");
    if (!token) {
      setUserData(null);
      navigate("/login");
      return;
    }

  
    fetchProfileData();
  
  }, [isCheckingAuth]);


  const forceGlobalLogout = () => {
    setUserData(null);
    localStorage.clear();
    navigate("/login");
  };

  const fetchProfileData = async (isRetry = false,passedToken?: string) => {
    setLoading(true);
    setGlobalError("");

     const tokenToUse = passedToken || userData?.jwtToken;

    const config = {
      headers: { Authorization: "Bearer " + tokenToUse ,'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'},
    };

    try {
      const response = await axios.get(
        import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/users/profile",
        config,
      );

      setEmail(response.data.email);
      setFirstName(response.data.firstName);
      setLastName(response.data.lastName);
      setMailNotifications(response.data.mailNotifications);
      setAppNotifications(response.data.appNotifications);
    } catch (error: any) {
      console.error("Error fetching profile:", error);

      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/refresh-token",
            {
              refreshToken: currentRefreshToken,
            },
            { headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } }
          );

          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken,
            );
          }

          setUserData({ ...userData, jwtToken: newAccessToken });
          await fetchProfileData(true,newAccessToken);
        } catch (refreshError) {
          forceGlobalLogout();
        }
      } else {
        setGlobalError("Failed to load profile data.");
      }
    } finally {
      if (!isRetry) setLoading(false);
    }
  };


  const handleEnableEdit = () => {
    setProfileBackup({
      firstName,
      lastName,
      mailNotifications,
      appNotifications,
    });
    setSuccessMessage("");
    setGlobalError("");
    setIsEditable(true);
  };

  const handleCancelEdit = () => {
    if (profileBackup) {
      setFirstName(profileBackup.firstName);
      setLastName(profileBackup.lastName);
      setMailNotifications(profileBackup.mailNotifications);
      setAppNotifications(profileBackup.appNotifications);
    }
    setIsEditable(false);
    setGlobalError("");
  };

  const handleSaveChanges = async (isRetry = false,passedToken?: string) => {
    setSaving(true);
    setGlobalError("");
    setSuccessMessage("");

     const tokenToUse = passedToken || userData?.jwtToken;

    const config = {
      headers: { Authorization: "Bearer " + tokenToUse ,'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'},
    };

    const patchBody = {
      firstName,
      lastName,
      mailNotifications,
      appNotifications,
    };

    try {
      await axios.patch(
        import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/users/profile",
        patchBody,
        config,
      );
      setSuccessMessage("Profile updated successfully!");
      setIsEditable(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);

      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/refresh-token",
            {
              refreshToken: currentRefreshToken,
            },
            { headers: { 
             'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
           } }
          );

          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken,
            );
          }

          setUserData({ ...userData, jwtToken: newAccessToken });
          await handleSaveChanges(true,newAccessToken);
        } catch (refreshError) {
          forceGlobalLogout();
        }
      } else {
        setGlobalError("Failed to update profile settings.");
      }
    } finally {
      if (!isRetry) setSaving(false);
    }
  };

  if (isCheckingAuth || loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
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
        borderRadius: 2,
      }}
    >
     
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: "bold", fontSize: { xs: "1.8rem", sm: "2rem" } }}
        >
          Profile Settings
        </Typography>

        {!isEditable && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LockResetIcon />}
              onClick={() => navigate("/change-password")}
              size="small"
              sx={{ width: { xs: "100%", sm: "auto" } }} 
            >
              Change Password
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEnableEdit}
              size="small"
              sx={{ width: { xs: "100%", sm: "auto" } }} 
            >
              Edit Profile
            </Button>
          </Stack>
        )}
      </Box>

      {globalError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {globalError}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Box component="form" noValidate>
     
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: "bold", textTransform: "uppercase" }}
            >
              Email Address
            </Typography>
           
          </Stack>
          <Typography
            variant="body1"
            sx={{ fontWeight: 500, color: "text.secondary" }}
          >
            {email}
          </Typography>
        </Box>

      
        {isEditable ? (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
            />
          </>
        ) : (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            sx={{ mb: 3, mt: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold", textTransform: "uppercase" }}
              >
                First Name
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
              >
                {firstName}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold", textTransform: "uppercase" }}
              >
                Last Name
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
              >
                {lastName}
              </Typography>
            </Box>
          </Stack>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Notification Preferences
        </Typography>

        {/* Preferenze di Notifica Condizionali */}
        {isEditable ? (
          <Stack direction="column" spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={mailNotifications}
                  onChange={(e) => setMailNotifications(e.target.checked)}
                  disabled={saving}
                />
              }
              label="Receive Email Notifications"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={appNotifications}
                  onChange={(e) => setAppNotifications(e.target.checked)}
                  disabled={saving}
                />
              }
              label="Receive In-App Notifications"
            />
          </Stack>
        ) : (
          <Stack direction="column" spacing={2} sx={{ mt: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Receive Email Notifications
              </Typography>
              {mailNotifications ? (
                <CheckCircleOutlineIcon color="success" />
              ) : (
                <HighlightOffIcon color="error" />
              )}
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Receive In-App Notifications
              </Typography>
              {appNotifications ? (
                <CheckCircleOutlineIcon color="success" />
              ) : (
                <HighlightOffIcon color="error" />
              )}
            </Stack>
          </Stack>
        )}

        {/* Pulsanti di Azione della Modifica */}
        {isEditable && (
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<CloseIcon />}
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={
                saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={() => handleSaveChanges(false)}
              disabled={saving}
            >
              Save
            </Button>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

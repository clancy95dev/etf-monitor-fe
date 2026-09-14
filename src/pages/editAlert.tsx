import { useState, useEffect, useContext } from "react";
import axios from "axios";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import {
  Typography,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Divider,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";
import { AppContext } from "../App";
import { AlertDialog } from "../components/alertDialog";

import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import { useParams, useNavigate } from "react-router-dom";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export const EditAlert = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { userData, setUserData, isCheckingAuth } = useContext(AppContext);

  const alertTypeMap = new Map([
    ["TER_CHANGE", "Ter Change"],
    ["INACTIVATION", "Inactivation"],
    ["PRICE_ABOVE", "Price Above"],
    ["PRICE_UNDER", "Price Under"],
    ["VOLUME_ABOVE", "Volume Above"],
    ["VOLUME_UNDER", "Volume Under"],
    ["YIELD_ABOVE", "Yield Above"],
    ["YIELD_UNDER", "Yield Under"],
  ]);

  const [alertConditionList, setAlertConditionList] = useState([] as any[]);
  const [watchlistInfo, setWatchlistInfo] = useState<any>(null);

  const [availableAlertTypeList, setAvailableAlertTypeList] = useState([] as any[]);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedAlertIds, setSelectedAlertIds] = useState<number[]>([]);

  useEffect(() => {
    if (isCheckingAuth) return;

    const token = localStorage.getItem("refreshToken");
    if (!token) {
      setUserData(null);
      navigate("/login");
      return;
    }

    if (id) {
      loadData(Number(id));
    } else {
      console.error("No ID found in page URL.");
      setLoading(false);
    }
  }, [isCheckingAuth, id]);

  const loadData = async (watchlistId: number, isRetry = false, passedToken?: string) => {
    setLoading(true);
    const loadUrl = import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/watchlists/" + watchlistId;

    const tokenToUse = passedToken || userData?.jwtToken;

    const config = {
      headers: {
        Authorization: "Bearer " + tokenToUse,
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      },
    };

    try {
      const response = await axios.get(loadUrl, config);

      setWatchlistInfo({
        id: response.data.id,
        etfId: response.data.etfId,
        isin: response.data.isin,
        currency: response.data.currency,
        shortName: response.data.shortName,
        longName: response.data.longName,
        fundSize: response.data.fundSize,
        ter: response.data.ter,
        y1Yield: response.data.y1Yield,
        type: response.data.type,
      });

      setAlertConditionList(response.data.alertConditionList || []);
      setSelectedAlertIds([]);
    } catch (error: any) {
      console.error("Error loading watchlist details:", error);

      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/auth/refresh-token",
            { token: currentRefreshToken },
            {
              headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
              }
            }
          );

          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }

          setUserData({ ...userData, jwtToken: newAccessToken });
          await loadData(watchlistId, true, newAccessToken);
        } catch (refreshError) {
          setUserData(null);
          localStorage.clear();
          navigate("/login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = alertConditionList.map((n) => n.id);
      setSelectedAlertIds(newSelecteds);
      return;
    }
    setSelectedAlertIds([]);
  };

  const handleSelectRowClick = (id: number) => {
    const selectedIndex = selectedAlertIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedAlertIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedAlertIds.slice(1));
    } else if (selectedIndex === selectedAlertIds.length - 1) {
      newSelected = newSelected.concat(selectedAlertIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedAlertIds.slice(0, selectedIndex),
        selectedAlertIds.slice(selectedIndex + 1)
      );
    }
    setSelectedAlertIds(newSelected);
  };

  const toNewAlert = () => {
    let tmp = {
      id: null,
      alertType: "",
      isActive: false,
      price: 0,
      volume: 0,
      etfYield: 0,
      yieldInterval: "",
    };

    let tmpMap = new Map();
    let tmpList = [];

    for (let condition of alertConditionList) {
      if (alertTypeMap.has(condition.conditionType)) {
        tmpMap.set(condition.conditionType, alertTypeMap.get(condition.conditionType));
      }
    }

    for (const [a, b] of alertTypeMap) {
      if (!tmpMap.has(a)) {
        tmpList.push({ value: a, label: b });
      }
    }

    setAvailableAlertTypeList(tmpList);
    setEditingAlert(tmp);
    setAlertDialogOpen(true);
  };

  const handleSaveAlert = async (alertData: any, isRetry = false, passedToken?: string) => {
    setLoading(true);
    let url = import.meta.env.VITE_API_URL + `/etf-portfolio/api/v1/watchlists/${id}/alerts`;
    if (alertData.id != null) {
      url += "/" + alertData.id;
    }

    const tokenToUse = passedToken || userData?.jwtToken;

    const config = {
      headers: {
        Authorization: "Bearer " + tokenToUse,
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      },
    };

    let request = {
      active: alertData.active,
      threshold: alertData.threshold,
      conditionType: alertData.conditionType,
      checkInterval: alertData.checkInterval !== "" ? alertData.checkInterval : null
    };

    try {
      if (alertData.id != null) {
        await axios.put(url, request, config);
      } else {
        await axios.post(url, request, config);
      }
      if (id) await loadData(Number(id), false, tokenToUse);
    } catch (error: any) {
      console.error("Error saving alert:", error);
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/auth/refresh-token", {
            token: currentRefreshToken
          }, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
            }
          });
          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }
          setUserData({ ...userData, jwtToken: newAccessToken });
          await handleSaveAlert(alertData, true, newAccessToken);
        } catch (refreshError) {
          setUserData(null);
          localStorage.clear();
          navigate("/login");
        }
      } else {
        setLoading(false);
      }
    }
  };

  const handleDeleteAlerts = async (ids: number[], isRetry = false, passedToken?: string) => {
    if (ids.length === 0) return;
    setLoading(true);

    let url = import.meta.env.VITE_API_URL + `/etf-portfolio/api/v1/watchlists/${id}/alerts?ids=${ids.join(",")}`;

    const tokenToUse = passedToken || userData?.jwtToken;

    const config = {
      headers: { Authorization: "Bearer " + tokenToUse },
    };

    try {
      await axios.delete(url, config);
      if (id) await loadData(Number(id));
    } catch (error: any) {
      console.error("Error deleting alerts:", error);
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/auth/refresh-token", {
            token: currentRefreshToken,
          }, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
            }
          });
          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }
          setUserData({ ...userData, jwtToken: newAccessToken });
          await handleDeleteAlerts(ids, true, newAccessToken);
        } catch (refreshError) {
          setUserData(null);
          localStorage.clear();
          navigate("/login");
        }
      } else {
        setLoading(false);
      }
    }
  };

  const toEditAlert = (alertData: any) => {
    let tmp = {
      id: alertData.id,
      alertType: alertData.conditionType,
      active: alertData.active,
      price: alertData.conditionType === "PRICE_UNDER" || alertData.conditionType === "PRICE_ABOVE" ? alertData.threshold : 0,
      volume: alertData.conditionType === "VOLUME_UNDER" || alertData.conditionType === "VOLUME_ABOVE" ? alertData.threshold : 0,
      etfYield: alertData.conditionType === "YIELD_UNDER" || alertData.conditionType === "YIELD_ABOVE" ? alertData.threshold : 0,
      yieldInterval: alertData.checkInterval || "",
    };

    let tmpMap = new Map();
    let tmpList = [];

    for (let condition of alertConditionList) {
      if (alertTypeMap.has(condition.conditionType)) {
        if (condition.conditionType !== alertData.conditionType) {
          tmpMap.set(condition.conditionType, alertTypeMap.get(condition.conditionType));
        }
      }
    }

    for (const [a, b] of alertTypeMap) {
      if (!tmpMap.has(a)) {
        tmpList.push({ value: a, label: b });
      }
    }

    setAvailableAlertTypeList(tmpList);
    setEditingAlert(tmp);
    setAlertDialogOpen(true);
  };

  const getResponsiveCellStyles = (columnId: string) => {
    const basePadding = { xs: "12px 8px", md: "16px 12px" };
    if (columnId === "threshold") {
      return { padding: basePadding, display: { xs: 'none', sm: 'table-cell' } };
    }
    return { padding: basePadding };
  };

  
  if (isCheckingAuth || (loading && !watchlistInfo)) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: { xs: "98%", md: "92%", lg: "85%" }, margin: "2rem auto" }}>
      {watchlistInfo && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            bgcolor: "background.paper"
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 3
            }}
          >
            <Box sx={{ width: { xs: "100%", md: "60%" } }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  mb: 1.5,
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2rem' }
                }}
              >
                {watchlistInfo.longName || watchlistInfo.shortName || "N/A"}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" color="text.secondary">
                  ISIN: <strong style={{ color: '#f5f7fa' }}>{watchlistInfo.isin}</strong>
                </Typography>
                <Chip label={watchlistInfo.type} variant="outlined" size="small" />
              </Stack>
            </Box>

            <Box sx={{ width: { xs: "100%", md: "auto" } }}>
              <Stack
                direction="row"
                spacing={3}
                justifyContent={{ xs: "flex-start", md: "flex-end" }}
                divider={<Divider orientation="vertical" flexItem />}
              >
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary" display="block">FUND SIZE</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {watchlistInfo.fundSize != null ? `${watchlistInfo.fundSize} M` : "N/A"}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary" display="block">TER</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    {watchlistInfo.ter != null ? `${watchlistInfo.ter}%` : "N/A"}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary" display="block">1Y YIELD</Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "bold",
                      color: watchlistInfo.y1Yield >= 0 ? "success.main" : "error.main",
                    }}
                  >
                    {watchlistInfo.y1Yield != null
                      ? `${watchlistInfo.y1Yield > 0 ? "+" : ""}${watchlistInfo.y1Yield.toFixed(2)}%`
                      : "N/A"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 3
          }}
        >
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
              ALERT CONDITIONS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              {alertConditionList.length} of 8 alerts active.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {selectedAlertIds.length > 0 && (
              <Button
                variant="contained"
                color="error"
                disabled={loading}
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteAlerts(selectedAlertIds)}
                sx={{ fontWeight: "bold", width: { xs: "100%", sm: "auto" } }}
              >
                Delete Selected ({selectedAlertIds.length})
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={alertConditionList.length >= 8 || loading}
              onClick={toNewAlert}
              startIcon={<AddCircleOutlineIcon />}
              sx={{ fontWeight: "bold", px: 3, width: { xs: "100%", sm: "auto" } }}
            >
              ADD ALERT
            </Button>
          </Stack>

          <AlertDialog
            availableAlertTypeList={availableAlertTypeList}
            alertDialogOpen={alertDialogOpen}
            setAlertDialogOpen={setAlertDialogOpen}
            handleSaveAlert={handleSaveAlert}
            editingAlert={editingAlert}
            setEditingAlert={setEditingAlert}
          />
        </Box>

        <TableContainer sx={{ maxHeight: "35rem" }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ padding: { xs: "10px 8px", md: "16px 12px" } }}>
                  <Checkbox
                    color="primary"
                    disabled={loading}
                    indeterminate={selectedAlertIds.length > 0 && selectedAlertIds.length < alertConditionList.length}
                    checked={alertConditionList.length > 0 && selectedAlertIds.length === alertConditionList.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Condition type</TableCell>
                <TableCell sx={{ fontWeight: "bold", display: { xs: 'none', sm: 'table-cell' } }}>Threshold</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Edit</TableCell>
              </TableRow>
            </TableHead>

            <TableBody style={{ position: "relative" }}>
              {/* OVERLAY SFOCATO: Appare sopra le righe correnti senza smontare la tabella */}
              {loading && alertConditionList.length > 0 && (
                <TableRow style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2 }}>
                  <TableCell colSpan={5} style={{
                    padding: 0,
                    border: "none",
                    backgroundColor: "rgba(18, 18, 18, 0.55)",
                    backdropFilter: "blur(2px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%"
                  }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              )}

              
              {alertConditionList.map((row, index) => {
                const isItemSelected = selectedAlertIds.indexOf(row.id) !== -1;
                return (
                  <TableRow key={index} hover selected={isItemSelected}>
                    <TableCell padding="checkbox" sx={{ padding: { xs: "12px 8px", md: "16px 12px" } }}>
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        disabled={loading}
                        onChange={() => handleSelectRowClick(row.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {alertTypeMap.get(row.conditionType) || row.conditionType}
                    </TableCell>
                    <TableCell sx={getResponsiveCellStyles("threshold")}>
                      {row.checkInterval != null ? `${row.threshold} — ${row.checkInterval}` : row.threshold}
                    </TableCell>
                    <TableCell sx={{ padding: { xs: "12px 8px", md: "16px 12px" } }}>
                      {row.active ? (
                        <Chip
                          icon={<CheckCircleIcon style={{ color: 'inherit', fontSize: '16px' }} />}
                          label="Active"
                          color="success"
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon style={{ color: 'inherit', fontSize: '16px' }} />}
                          label="Inactive"
                          variant="outlined"
                          size="small"
                          sx={{ color: "text.secondary", borderColor: "divider" }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ padding: { xs: "8px", md: "12px" } }}>
                      <Tooltip title="Modify Alert" arrow>
                        <IconButton
                          onClick={() => toEditAlert(row)}
                          color="primary"
                          disabled={loading}
                          sx={{ '&:hover': { backgroundColor: "action.hover" } }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

              
              {alertConditionList.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      No alert conditions configured for this item.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              
              {alertConditionList.length === 0 && loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";


const RANGE_MAP: Record<string, string> = {
  "1M": "M1",
  "3M": "M3",
  "6M": "M6",
  "1Y": "Y1",
  "3Y": "Y3",
  "5Y": "Y5",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper
        elevation={4}
        sx={{
          p: 1.5,
          bgcolor: "#1e2736",
          border: "1px solid #303b4e",
          color: "#fff",
        }}
      >
        <Typography variant="caption" sx={{ color: "#90caf9", fontWeight: "bold" }}>
          {label}
        </Typography>
        {data.close !== undefined && (
          <Typography variant="body2" sx={{ fontWeight: "bold", mt: 0.5, color: "#4caf50" }}>
            Close: €{Number(data.close).toFixed(2)}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
          {data.high !== undefined && (
            <Typography variant="caption" sx={{ color: "#81c784" }}>
              High: €{Number(data.high).toFixed(2)}
            </Typography>
          )}
          {data.low !== undefined && (
            <Typography variant="caption" sx={{ color: "#e57373" }}>
              Low: €{Number(data.low).toFixed(2)}
            </Typography>
          )}
        </Box>
      </Paper>
    );
  }
  return null;
};

export const EtfDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData, setUserData, isCheckingAuth } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [currentEtf, setEtf] = useState<any>(null);
  const [currentWatchlistId, setWatchlistId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  
  const [timeRange, setTimeRange] = useState<string>("1M");
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  const forceGlobalLogout = () => {
    setUserData(null);
    localStorage.clear();
    navigate("/login");
  };

  
  const loadChartData = async (
    etfId: string,
    selectedRange: string,
    isRetry = false,
    passedToken?: string
  ) => {
    setChartLoading(true);

    const tokenToUse = passedToken || userData?.jwtToken;
    const backendRange = RANGE_MAP[selectedRange] || "M1";

    const loadUrl = `${import.meta.env.VITE_API_URL}/etf-catalog/api/v1/etfs/${etfId}/quotes?range=${backendRange}`;

    const config = {
      headers: {
        Authorization: tokenToUse ? `Bearer ${tokenToUse}` : "",
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await axios.get(loadUrl, config);
      
      
      const quotes = response.data?.quoteSearchList || [];

      setChartData(quotes);
    } catch (error: any) {
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/etf-portfolio/api/v1/auth/refresh-token`,
            { token: currentRefreshToken },
            {
              headers: {
                "ngrok-skip-browser-warning": "true",
                "Content-Type": "application/json",
              },
            }
          );

          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }

          setUserData({ ...userData, jwtToken: newAccessToken });
          await loadChartData(etfId, selectedRange, true, newAccessToken);
        } catch (refreshError) {
          forceGlobalLogout();
        }
      } else {
        console.error("Errore durante il recupero dei dati delle quotazioni:", error);
      }
    } finally {
      setChartLoading(false);
    }
  };

  const loadData = async (etfId: string, isRetry = false, passedToken?: string) => {
    setLoading(true);

    const tokenToUse = passedToken || userData?.jwtToken;

    if (tokenToUse != null) {
      const loadWatchlistUrl = `${import.meta.env.VITE_API_URL}/etf-portfolio/api/v1/watchlists/check-watchlist?ids=${etfId}`;
      const watchlistConfig = {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      };

      try {
        const response = await axios.get(loadWatchlistUrl, watchlistConfig);
        let etfAndWatchlsitIdList = response.data.etfAndWatchlistIdList;

        if (etfAndWatchlsitIdList && etfAndWatchlsitIdList.length > 0) {
          setWatchlistId(etfAndWatchlsitIdList[0].watchlistId);
        } else {
          setWatchlistId(null);
        }
      } catch (error: any) {
        if (error.response?.status === 401 && !isRetry) {
          try {
            const currentRefreshToken = localStorage.getItem("refreshToken");
            const refreshResponse = await axios.post(
              import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/auth/refresh-token",
              { token: currentRefreshToken },
              {
                headers: {
                  "ngrok-skip-browser-warning": "true",
                  "Content-Type": "application/json",
                },
              }
            );

            const newAccessToken = refreshResponse.data.token;
            if (refreshResponse.data.refreshToken) {
              localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
            }

            setUserData({ ...userData, jwtToken: newAccessToken });
            await loadData(etfId, true, newAccessToken);
          } catch (refreshError) {
            setUserData(null);
            localStorage.clear();
            navigate("/etf");
          }
        }
      }
    }

    const loadUrl = `${import.meta.env.VITE_API_URL}/etf-catalog/api/v1/etfs/${etfId}`;
    const config = {
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await axios.get(loadUrl, config);
      setEtf(response.data);
    } catch (error: any) {
      console.error("cannot find etf");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCheckingAuth) return;

    if (id) {
      loadData(id);
      loadChartData(id, timeRange);
    } else {
      navigate("/etf");
    }
  }, [id, isCheckingAuth]);

  
  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRange: string | null
  ) => {
    if (newRange !== null && id) {
      setTimeRange(newRange);
      loadChartData(id, newRange);
    }
  };

  const addToWatchlist = async (isRetry = false, passedToken?: string) => {
    if (!userData?.jwtToken) {
      navigate("/login");
      return;
    }

    const tokenToUse = passedToken || userData?.jwtToken;

    setActionLoading(true);

    const loadUrl = `${import.meta.env.VITE_API_URL}/etf-portfolio/api/v1/watchlists`;
    const config = {
      headers: {
        Authorization: "Bearer " + tokenToUse,
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
      },
    };
    const json = { etfId: currentEtf.id };

    try {
      const response = await axios.post(loadUrl, json, config);
      setWatchlistId(response.data);
    } catch (error: any) {
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/etf-portfolio/api/v1/auth/refresh-token`,
            { token: currentRefreshToken },
            {
              headers: {
                "ngrok-skip-browser-warning": "true",
                "Content-Type": "application/json",
              },
            }
          );
          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }
          setUserData({ ...userData, jwtToken: newAccessToken });
          await addToWatchlist(true, newAccessToken);
        } catch (refreshError) {
          forceGlobalLogout();
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const removeFromWatchlist = async (isRetry = false, passedToken?: string) => {
    if (!userData?.jwtToken) {
      navigate("/login");
      return;
    }

    const tokenToUse = passedToken || userData?.jwtToken;

    setActionLoading(true);
    const loadUrl = `${import.meta.env.VITE_API_URL}/etf-portfolio/api/v1/watchlists?ids=${currentWatchlistId}`;
    const config = {
      headers: {
        Authorization: "Bearer " + tokenToUse,
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
      },
    };

    try {
      await axios.delete(loadUrl, config);
      setWatchlistId(null);
    } catch (error: any) {
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/etf-portfolio/api/v1/auth/refresh-token`,
            { token: currentRefreshToken },
            {
              headers: {
                "ngrok-skip-browser-warning": "true",
                "Content-Type": "application/json",
              },
            }
          );
          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          }
          setUserData({ ...userData, jwtToken: newAccessToken });
          await removeFromWatchlist(true, newAccessToken);
        } catch (refreshError) {
          forceGlobalLogout();
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const renderYield = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    const color = value >= 0 ? "secondary.main" : "error.main";
    const sign = value > 0 ? "+" : "";
    return (
      <Typography variant="body1" sx={{ color, fontWeight: "bold" }}>
        {sign}{value.toFixed(2)}%
      </Typography>
    );
  };

  if (isCheckingAuth || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentEtf) {
    return (
      <Box sx={{ width: "50%", margin: "5% auto", textAlign: "center" }}>
        <Typography variant="h5" color="error">
          ETF non trovato o ID non valido.
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Torna indietro
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: { xs: "92%", md: "85%", lg: "70%" }, margin: "2rem auto" }}>
      
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }} variant="text">
        Back to Search
      </Button>

      {/* HEADER PRINCIPALE */}
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, mb: 4, borderRadius: 2, border: "1px solid #303b4e", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 3 }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: "bold", mb: 1, lineHeight: 1.2 }}>
              {currentEtf.longName || currentEtf.shortName || "N/A"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Chip label={currentEtf.symbol} color="primary" variant="outlined" size="small" sx={{ fontWeight: "bold" }} />
              <Typography variant="body2" color="text.secondary">
                ISIN: <strong>{currentEtf.isin}</strong>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: { xs: "left", sm: "right" }, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
              {currentEtf.regularMarketPrice
                ? `${currentEtf.regularMarketPrice.toFixed(2)} ${currentEtf.currency || "EUR"}`
                : "N/A"}
            </Typography>

            <Box sx={{ mb: 1 }}>
              {currentWatchlistId == null ? (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  fullWidth={isCheckingAuth}
                  startIcon={actionLoading ? <CircularProgress size={16} /> : <StarBorderIcon />}
                  onClick={() => addToWatchlist()}
                  disabled={actionLoading}
                >
                  Add to Watchlist
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <StarIcon />}
                  onClick={() => removeFromWatchlist()}
                  disabled={actionLoading}
                >
                  Remove from Watchlist
                </Button>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              Exchange: {currentEtf.exchangeCode || "N/A"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ height: "100%", border: "1px solid #303b4e", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Fund Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Instrument Type</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500 }}>{currentEtf.instrumentType || "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">TER</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500 }}>{currentEtf.ter != null ? `${currentEtf.ter}%` : "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Fund Size</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500 }}>{currentEtf.fundSize != null ? `${currentEtf.fundSize} M` : "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Inception Date</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500 }}>{currentEtf.firstQuoteDate || "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Distribution Type</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500 }}>{currentEtf.type || "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Sustainable (ESG)</Typography></Grid>
                <Grid size={{ xs: 6 }}><Chip label={currentEtf.sustainable ? "Yes" : "No"} color={currentEtf.sustainable ? "success" : "default"} size="small" /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ height: "100%", border: "1px solid #303b4e", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Market Data
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Daily Volume</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500 }}>{currentEtf.regularMarketVolume?.toLocaleString() || "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Market Day High</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500, color: "secondary.main" }}>{currentEtf.regularMarketDayHigh || "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Market Day Low</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body1" sx={{ fontWeight: 500, color: "error.main" }}>{currentEtf.regularMarketDayLow || "N/A"}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Status</Typography></Grid>
                <Grid size={{ xs: 6 }}><Chip label={currentEtf.active ? "Active" : "Inactive"} color={currentEtf.active ? "success" : "error"} size="small" /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid size={{ xs: 12 }}>
          <Card elevation={0} sx={{ border: "1px solid #303b4e", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Performance & Yields
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2} sx={{ textAlign: "center" }}>
                <Grid size={{ xs: 4, sm: 3, md: 1.71 }}><Typography variant="caption" color="text.secondary" display="block">Daily</Typography>{renderYield(currentEtf.dailyYield)}</Grid>
                <Grid size={{ xs: 4, sm: 3, md: 1.71 }}><Typography variant="caption" color="text.secondary" display="block">1 Month</Typography>{renderYield(currentEtf.m1yield)}</Grid>
                <Grid size={{ xs: 4, sm: 3, md: 1.71 }}><Typography variant="caption" color="text.secondary" display="block">3 Mos</Typography>{renderYield(currentEtf.m3yield)}</Grid>
                <Grid size={{ xs: 4, sm: 3, md: 1.71 }}><Typography variant="caption" color="text.secondary" display="block">6 Mos</Typography>{renderYield(currentEtf.m6yield)}</Grid>
                <Grid size={{ xs: 4, sm: 3, md: 1.71 }}><Typography variant="caption" color="text.secondary" display="block">1 Year</Typography>{renderYield(currentEtf.y1Yield)}</Grid>
                <Grid size={{ xs: 4, sm: 3, md: 1.71 }}><Typography variant="caption" color="text.secondary" display="block">3 Years</Typography>{renderYield(currentEtf.y3Yield)}</Grid>
                <Grid size={{ xs: 4, sm: 3, md: 1.71 }}><Typography variant="caption" color="text.secondary" display="block">5 Years</Typography>{renderYield(currentEtf.y5Yield)}</Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 4, mb: 2, color: "text.secondary" }}>
                Historical Calendar Year Performance
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2} sx={{ textAlign: "center" }}>
                <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary" display="block">Prev 1 Year</Typography>{renderYield(currentEtf.previous1YearYield)}</Grid>
                <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary" display="block">Prev 2 Years</Typography>{renderYield(currentEtf.previous2YearYield)}</Grid>
                <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary" display="block">Prev 3 Years</Typography>{renderYield(currentEtf.previous3yearYield)}</Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid size={{ xs: 12 }}>
          <Card elevation={0} sx={{ border: "1px solid #303b4e", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  mb: 2,
                  gap: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Price Performance Chart
                </Typography>

                <ToggleButtonGroup
                  value={timeRange}
                  exclusive
                  onChange={handleTimeRangeChange}
                  size="small"
                  color="primary"
                  disabled={chartLoading}
                >
                  <ToggleButton value="1M">1M</ToggleButton>
                  <ToggleButton value="3M">3M</ToggleButton>
                  <ToggleButton value="6M">6M</ToggleButton>
                  <ToggleButton value="1Y">1Y</ToggleButton>
                  <ToggleButton value="3Y">3Y</ToggleButton>
                  <ToggleButton value="5Y">5Y</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ width: "100%", height: 350, display: "flex", justifyContent: "center", alignItems: "center" }}>
                {chartLoading ? (
                  <CircularProgress size={32} />
                ) : chartData && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1976d2" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1976d2" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#2c384a" vertical={false} />
                      
                      <XAxis
                      dataKey="quoteDate"
                      stroke="#90caf9"
                      tick={{ fontSize: 11 }}
                      minTickGap={30} 
                      tickFormatter={(str) => {
                        if (!str) return "";
                        const date = new Date(str);
                       
                        return date.toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                        });
                      }}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        stroke="#90caf9"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => `€${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} />

                      
                      <Area
                        type="linear"
                        dataKey="close"
                        stroke="#1976d2"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorClose)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Nessun dato storico disponibile per l'intervallo selezionato.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
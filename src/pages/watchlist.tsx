import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AppContext } from "../App";
import {
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  Box,
  TableRow,
  TableSortLabel,
  Typography,
  Checkbox,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

interface ColumnConfig {
  id: string;
  label: string;
  sortKey?: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: "name", label: "Fund name" },
  { id: "fundSize", label: "Fund Size", sortKey: "fundSize" },
  { id: "ter", label: "TER", sortKey: "ter" },
  { id: "y1Yield", label: "1Y in %", sortKey: "y1Yield" },
  { id: "price", label: "Price", sortKey: "regularMarketPrice" },
  { id: "distribution", label: "Distribution" },
  { id: "isin", label: "ISIN", sortKey: "isin" },
  { id: "symbol", label: "Ticker", sortKey: "symbol" },
];

export const Watchlist = () => {
  const navigate = useNavigate();
  const { userData, setUserData, isCheckingAuth } = useContext(AppContext);

  const [totalItems, setTotalItems] = useState(0);
  const [tableData, setTableData] = useState([] as any[]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const searchData = {
    sortField: searchParams.get("sortField") || "fundSize",
    sortDirection: searchParams.get("sortDirection") || "DESC",
  };

  useEffect(() => {
    if (isCheckingAuth) return;

    const token = localStorage.getItem("refreshToken");
    if (!token) {
      setUserData(null);
      navigate("/login");
      return;
    }

    if (!searchParams.get("sortField")) {
      updateUrlParams(searchData);
      return;
    }

    loadData(searchData);
  }, [searchParams, isCheckingAuth]);

  const updateUrlParams = (newFilters: any) => {
    const params: Record<string, string> = {};
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];
      if (value !== "" && value !== null && value !== undefined) {
        params[key] = String(value);
      }
    });
    setSearchParams(params);
  };

  const loadData = async (
    searchData: any,
    isRetry = false,
    passedToken?: string,
  ) => {
    const loadUrl = import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/watchlists/search-watchlist";
    const config: any = { params: { ...searchData } };

    const tokenToUse = passedToken || userData?.jwtToken;

    
    config.headers = { Authorization: "Bearer " + tokenToUse,'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json' };
    

    try {
      const response = await axios.get(loadUrl, config);
      setTableData(response.data.watchlistItemList);
      setTotalItems(response.data.watchlistItemList.length);
    } catch (error: any) {
      console.error("Error loading ETF list:", error);
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/refresh-token",
            {
              token: currentRefreshToken,
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
          await loadData(searchData, true, newAccessToken);
        } catch (refreshError) {
          setUserData(null);
          localStorage.clear();
          navigate("/login");
        }
      }
    }
  };

  const handleSortRequest = (columnName: string) => {
    const nextDirection =
      columnName === searchData.sortField && searchData.sortDirection === "ASC"
        ? "DESC"
        : "ASC";

    updateUrlParams({
      ...searchData,
      sortField: columnName,
      sortDirection: nextDirection,
    });
  };

  const showEtf = (etfData: any) => {
    navigate(`/etf/${etfData.id}`);
  };

  const toWatchlistAletList = (etfData: any) => {
    navigate(`/alert/${etfData.watchlistId}`);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = tableData
        .map((n) => n.watchlistId)
        .filter((id) => id != null);
      setSelectedIds(newSelecteds);
      return;
    }
    setSelectedIds([]);
  };

  const handleSelectRow = (watchlistId: number) => {
    const selectedIndex = selectedIds.indexOf(watchlistId);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedIds, watchlistId];
    } else {
      newSelected = selectedIds.filter((id) => id !== watchlistId);
    }

    setSelectedIds(newSelected);
  };

  const removeFromWatchlist = async (
    watchlistIdList: number[],
    isRetry = false,
    passedToken?: string,
  ) => {
    if (isCheckingAuth) return;

    const tokenToUse = passedToken || userData?.jwtToken;

    if (!tokenToUse) {
      navigate("/login");
      return;
    }

    setActionLoading(true);

    const idsCommaSeparated = watchlistIdList.join(",");
    let loadUrl =
     import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/watchlists?ids=" + idsCommaSeparated;

    const config = {
      headers: { Authorization: "Bearer " + tokenToUse,'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json' },
    };

    try {
      await axios.delete(loadUrl, config);

      const updatedList = tableData.filter(
        (m: any) => !watchlistIdList.includes(m.watchlistId),
      );

      setTableData(updatedList);
      setTotalItems(updatedList.length);
      setSelectedIds([]);
    } catch (error: any) {
      console.error("Error removing from watchlist:", error);

      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(
            import.meta.env.VITE_API_URL+"/etf-portfolio/api/v1/auth/refresh-token",
            {
              token: currentRefreshToken,
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
          await removeFromWatchlist(watchlistIdList, true, newAccessToken);
        } catch (refreshError) {
          setUserData(null);
          localStorage.clear();
          navigate("/login");
        }
      }
    } finally {
      if (!isRetry) setActionLoading(false);
    }
  };

  const isSelected = (watchlistId: number) =>
    selectedIds.indexOf(watchlistId) !== -1;

  const getResponsiveCellStyles = (columnId: string) => {
    const basePadding = { xs: "10px 8px", md: "16px 12px" };

    switch (columnId) {
      case "ter":
      case "symbol":
        return {
          padding: basePadding,
          display: { xs: "none", sm: "table-cell" },
        };
      case "distribution":
        return {
          padding: basePadding,
          display: { xs: "none", md: "table-cell" },
        };
      case "isin":
        return {
          padding: basePadding,
          display: { xs: "none", lg: "table-cell" },
        };
      default:
        return { padding: basePadding };
    }
  };

  if (isCheckingAuth) {
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
        width: { xs: "98%", md: "92%", lg: "85%" },
        overflow: "hidden",
        margin: "2rem auto",
        paddingBottom: "1rem",
      }}
    >
      {/* Header layout unified to match EtfPage */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          padding: "1.5rem 1.5rem 1rem 1.5rem",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2rem" },
              letterSpacing: "-0.5px",
            }}
          >
            WATCHLIST ITEMS
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {totalItems} items in your watchlist.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="error"
          disabled={selectedIds.length === 0 || actionLoading}
          onClick={() => removeFromWatchlist(selectedIds)}
          startIcon={
            actionLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteIcon />
            )
          }
          sx={{
            width: { xs: "100%", sm: "auto" },
            fontWeight: "bold",
            px: 3,
          }}
        >
          {selectedIds.length > 0
            ? `Remove selection (${selectedIds.length})`
            : "Remove from watchlist"}
        </Button>
      </Box>

      <TableContainer sx={{ overflowX: "auto" }}>
        <Table
          stickyHeader
          aria-label="sticky table"
          sx={{ minWidth: { xs: "100%", sm: 800 } }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{ padding: { xs: "10px 8px", md: "16px 12px" } }}
              >
                <Checkbox
                  color="primary"
                  indeterminate={
                    selectedIds.length > 0 &&
                    selectedIds.length < tableData.length
                  }
                  checked={
                    tableData.length > 0 &&
                    selectedIds.length === tableData.length
                  }
                  onChange={handleSelectAllClick}
                  disabled={tableData.length === 0}
                />
              </TableCell>

              {COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    fontWeight: "bold",
                    ...getResponsiveCellStyles(column.id),
                  }}
                >
                  {column.sortKey ? (
                    <TableSortLabel
                      active={searchData.sortField === column.sortKey}
                      direction={
                        searchData.sortField === column.sortKey &&
                        searchData.sortDirection === "ASC"
                          ? "asc"
                          : "desc"
                      }
                      onClick={() => handleSortRequest(column.sortKey!)}
                      sx={{
                        "& .MuiTableSortLabel-icon": {
                          color:
                            searchData.sortField === column.sortKey
                              ? "primary.main"
                              : "inherit",
                          opacity:
                            searchData.sortField === column.sortKey ? 1 : 0.4,
                        },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              <TableCell
                sx={{
                  fontWeight: "bold",
                  padding: { xs: "10px 8px", md: "16px 12px" },
                  textAlign: "center",
                }}
              >
                Alerts
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => {
              const isItemSelected = isSelected(row.watchlistId);
              return (
                <TableRow
                  key={index}
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  selected={isItemSelected}
                >
                  <TableCell
                    padding="checkbox"
                    sx={{ padding: { xs: "12px 8px", md: "16px 12px" } }}
                  >
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      onChange={() => handleSelectRow(row.watchlistId)}
                    />
                  </TableCell>

                  <TableCell
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      fontWeight: "bold",
                      padding: { xs: "12px 8px", md: "16px 12px" },
                      maxWidth: { xs: "140px", sm: "none" },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: { xs: "nowrap", sm: "normal" },
                    }}
                    onClick={() => showEtf(row)}
                  >
                    {row.longName != null ? row.longName : row.shortName}
                  </TableCell>
                  <TableCell sx={getResponsiveCellStyles("fundSize")}>
                    {row.fundSize}
                  </TableCell>
                  <TableCell sx={getResponsiveCellStyles("ter")}>
                    {row.ter}
                  </TableCell>
                  <TableCell sx={getResponsiveCellStyles("y1Yield")}>
                    {row.y1Yield}
                  </TableCell>
                  <TableCell sx={getResponsiveCellStyles("price")}>
                    {row.regularMarketPrice}
                  </TableCell>
                  <TableCell sx={getResponsiveCellStyles("distribution")}>
                    {row.type}
                  </TableCell>
                  <TableCell sx={getResponsiveCellStyles("isin")}>
                    {row.isin}
                  </TableCell>
                  <TableCell sx={getResponsiveCellStyles("symbol")}>
                    {row.symbol}
                  </TableCell>

                  <TableCell
                    sx={{
                      padding: { xs: "8px", md: "12px" },
                      textAlign: "center",
                    }}
                  >
                    <Tooltip title="Manage Alerts" arrow>
                      <IconButton
                        onClick={() => toWatchlistAletList(row)}
                        color="primary"
                        sx={{ "&:hover": { backgroundColor: "action.hover" } }}
                      >
                        <NotificationsActiveIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

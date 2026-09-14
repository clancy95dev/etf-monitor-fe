import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../App";
import {
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableCell,
  Button,
  TableHead,
  Box,
  TableRow,
  TableSortLabel,
  Typography,
  IconButton,
  Tooltip
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { EtfSearchDialog } from "../components/etfSearchDialog";
import { useSearchParams } from 'react-router-dom';

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

export const EtfPage = () => {
  const navigate = useNavigate();
  const { userData, setUserData, isCheckingAuth } = useContext(AppContext);

  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [fromItem, setFromItem] = useState(0);
  const [toItem, setToItem] = useState(0);
  const [tableData, setTableData] = useState([] as any[]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const searchData = {
    mainFilter: searchParams.get('mainFilter') || "",
    firstTradeDateFrom: searchParams.get('firstTradeDateFrom') || null,
    firstTradeDateTo: searchParams.get('firstTradeDateTo') || null,
    terFrom: searchParams.get('terFrom') || "",
    terTo: searchParams.get('terTo') || "",
    priceFrom: searchParams.get('priceFrom') || "",
    priceTo: searchParams.get('priceTo') || "",
    sustainable: searchParams.get('sustainable') || "",
    typeFilter: searchParams.get('typeFilter') || "",
    d1YieldFrom: searchParams.get('d1YieldFrom') || "",
    d1YieldTo: searchParams.get('d1YieldTo') || "",
    m1YieldFrom: searchParams.get('m1YieldFrom') || "",
    m1YieldTo: searchParams.get('m1YieldTo') || "",
    y1YieldFrom: searchParams.get('y1YieldFrom') || "",
    y1YieldTo: searchParams.get('y1YieldTo') || "",
    fundSizeFrom: searchParams.get('fundSizeFrom') || "",
    fundSizeTo: searchParams.get('fundSizeTo') || "",
    marketVolumeFrom: searchParams.get('marketVolumeFrom') || "",
    marketVolumeTo: searchParams.get('marketVolumeTo') || "",
    page: parseInt(searchParams.get('page') || "1", 10),
    itemsPerPage: parseInt(searchParams.get('itemsPerPage') || "10", 10),
    sortField: searchParams.get('sortField') || "fundSize",
    sortDirection: searchParams.get('sortDirection') || "DESC",
  };

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!searchParams.get('page') || !searchParams.get('sortField')) {
      updateUrlParams(searchData);
      return;
    }
    loadData(searchData);
  }, [searchParams, isCheckingAuth]);

  const updateUrlParams = (newFilters: any) => {
    const params: Record<string, string> = {};
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = String(value);
      }
    });
    setSearchParams(params);
  };


  const loadWatchlistData = async (etfList: any, isRetry = false, passedToken?: string) => {

    const tokenToUse = passedToken || userData?.jwtToken;

    if (tokenToUse != null) {


      const idsCommaSeparated = etfList.map((e: any) => e.id).join(",");

      const loadWatchlistUrl = `${import.meta.env.VITE_API_URL}/etf-portfolio/api/v1/watchlists/check-watchlist?ids=${idsCommaSeparated}`;
      const watchlistConfig = {
        headers: {
          Authorization: `Bearer ${tokenToUse}`, 'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      };

      try {

        const response = await axios.get(loadWatchlistUrl, watchlistConfig);

        let etfAndWatchlistIdList = response.data.etfAndWatchlistIdList;

        if (etfAndWatchlistIdList && etfAndWatchlistIdList.length > 0) {

          const watchlistMap = new Map<number | string, number | string>();
          etfAndWatchlistIdList.forEach((item: any) => {
            watchlistMap.set(item.etfId, item.watchlistId);
          });


          const updatedEtfList = etfList.map((etf: any) => ({
            ...etf,
            watchlistId: watchlistMap.get(etf.id) || null
          }));
          setTableData(updatedEtfList);

        }

      } catch (error: any) {
        if (error.response?.status === 401 && !isRetry) {
          try {
            const currentRefreshToken = localStorage.getItem("refreshToken");
            const refreshResponse = await axios.post(
              import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/auth/refresh-token",
              { token: currentRefreshToken }, {
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
            await loadWatchlistData(etfList, true, newAccessToken);
          } catch (refreshError) {
            setUserData(null);
            localStorage.clear();
            navigate("/login");
          }
        }

      }

    }

  }

  const loadData = async (searchData: any) => {


    const loadUrl = import.meta.env.VITE_API_URL + "/etf-catalog/api/v1/etfs";
    const paramsForBackend = {
      ...searchData,
      sustainable: searchData.sustainable === "" ? null : searchData.sustainable === "true",
      typeFilter: searchData.typeFilter === "" ? null : searchData.typeFilter,
    };

    Object.keys(paramsForBackend).forEach((key) => {
      const value = paramsForBackend[key];
      if (value === "" || value === null || value === undefined) {
        delete paramsForBackend[key];
      }
    });

    const config: any = { params: { ...paramsForBackend } };

    config.headers = {
      'ngrok-skip-browser-warning': 'true',
      'Content-Type': 'application/json'
    }


    try {
      const response = await axios.get(loadUrl, config);
      setTableData(response.data.etfList);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
      setFromItem(response.data.fromItem);
      setToItem(response.data.toItem);
      loadWatchlistData(response.data.etfList)
    } catch (error: any) {

      console.error("cannot find etf");

    }

  };

  const handleApplyFilters = (newFilters: any) => {
    updateUrlParams({ ...searchData, ...newFilters, page: 1 });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== searchData.page) {
      updateUrlParams({ ...searchData, page: page });
    }
  };

  const handleSortRequest = (columnName: string) => {
    const nextDirection = columnName === searchData.sortField && searchData.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    updateUrlParams({
      ...searchData,
      sortField: columnName,
      sortDirection: nextDirection,
      page: 1
    });
  };

  const showEtf = (etfData: any) => {
    navigate(`/etf/${etfData.id}`);
  };

  const removeFromWatchlist = async (etfData: any, isRetry = false, passedToken?: string) => {
    if (isCheckingAuth) return;


    const tokenToUse = passedToken || userData?.jwtToken;


    if (!userData?.jwtToken) {
      console.log("Utente non loggato. Reindirizzamento al login...");
      navigate("/login");
      return;
    }

    let loadUrl = import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/watchlists?ids=" + etfData.watchlistId;
    const config = {
      headers: {
        Authorization: "Bearer " + tokenToUse, 'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      }
    };

    try {
      await axios.delete(loadUrl, config);
      const updatedList = tableData.map((m: any) => m.id === etfData.id ? { ...m, watchlistId: null } : m);
      setTableData(updatedList);
    } catch (error: any) {
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/auth/refresh-token", { token: currentRefreshToken },
            {
              headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
              }
            }
          );
          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          setUserData({ ...userData, jwtToken: newAccessToken });
          await removeFromWatchlist(etfData, true);
        } catch (refreshError) {
          setUserData(null);
          localStorage.clear();
          navigate("/login");
        }
      }
    }
  };

  const addToWatchlist = async (etfData: any, isRetry = false, passedToken?: string) => {
    if (isCheckingAuth) return;

    if (!userData?.jwtToken) {
      console.log("Utente non loggato. Reindirizzamento al login...");
      navigate("/login");
      return;
    }

    const tokenToUse = passedToken || userData?.jwtToken;


    let loadUrl = import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/watchlists";
    const config = {
      headers: {
        Authorization: "Bearer " + tokenToUse, 'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      }
    };
    let json = { etfId: etfData.id };

    try {
      const response = await axios.post(loadUrl, json, config);
      const updatedList = tableData.map((m: any) => m.id === etfData.id ? { ...m, watchlistId: response.data } : m);
      setTableData(updatedList);
    } catch (error: any) {
      if (error.response?.status === 401 && !isRetry) {
        try {
          const currentRefreshToken = localStorage.getItem("refreshToken");
          const refreshResponse = await axios.post(import.meta.env.VITE_API_URL + "/etf-portfolio/api/v1/auth/refresh-token", { token: currentRefreshToken },
            {
              headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
              }
            }
          );
          const newAccessToken = refreshResponse.data.token;
          if (refreshResponse.data.refreshToken) localStorage.setItem("refreshToken", refreshResponse.data.refreshToken);
          setUserData({ ...userData, jwtToken: newAccessToken });
          await addToWatchlist(etfData, true, newAccessToken);
        } catch (refreshError) {
          setUserData(null);
          localStorage.clear();
          navigate("/login");
        }
      }
    }
  };

  const fetchPageNumbers = () => {
    const currentPage = searchData.page;
    const total = totalPages;
    const siblingCount = 1;
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (total > totalBlocks) {
      const startPage = Math.max(2, currentPage - siblingCount);
      const endPage = Math.min(total - 1, currentPage + siblingCount);
      let pages: (number | string)[] = [];
      const hasLeftSpill = startPage > 2;
      const hasRightSpill = (total - endPage) > 1;
      const spillOffset = totalNumbers - (endPage - startPage + 1);

      switch (true) {
        case (hasLeftSpill && !hasRightSpill): {
          const extraPages = Array.from({ length: spillOffset }, (_, i) => startPage - i - 1);
          pages = [1, '...', ...extraPages.reverse(), ...Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i), total];
          break;
        }
        case (!hasLeftSpill && hasRightSpill): {
          const extraPages = Array.from({ length: spillOffset }, (_, i) => endPage + i + 1);
          pages = [1, ...Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i), ...extraPages, '...', total];
          break;
        }
        case (hasLeftSpill && hasRightSpill):
        default: {
          pages = [1, '...', ...Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i), '...', total];
          break;
        }
      }
      return pages;
    }
    return Array.from({ length: total }, (_, i) => i + 1);
  };

  const paginationRange = fetchPageNumbers();

  const getResponsiveCellStyles = (columnId: string) => {
    const basePadding = { xs: "10px 8px", md: "16px 12px" };

    switch (columnId) {
      case "ter":
      case "symbol":
        return { padding: basePadding, display: { xs: 'none', sm: 'table-cell' } };
      case "distribution":
        return { padding: basePadding, display: { xs: 'none', md: 'table-cell' } };
      case "isin":
        return { padding: basePadding, display: { xs: 'none', lg: 'table-cell' } };
      default:
        return { padding: basePadding };
    }
  };

  return (
    <Paper
      sx={{
        width: { xs: "98%", md: "92%", lg: "85%" },
        overflow: "hidden",
        margin: "2rem auto",
        paddingBottom: "1rem"
      }}
    >
      {/* Header unificato: Allinea titolo e bottone sulla stessa linea */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          padding: "1.5rem 1.5rem 1rem 1.5rem"
        }}
      >
        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
            letterSpacing: "-0.5px"
          }}
        >
          ETF LIST
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={() => setSearchDialogOpen(true)}
          sx={{
            width: { xs: "100%", sm: "auto" },
            fontWeight: "bold",
            px: 3 
          }}
        >
          SEARCH
        </Button>
      </Box>

      <EtfSearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        currentFilters={searchData}
        onApplyFilters={handleApplyFilters}
      />

      <TableContainer sx={{ overflowX: "auto" }}>
        <Table stickyHeader aria-label="sticky table" sx={{ minWidth: { xs: '100%', sm: 800 } }}>
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    fontWeight: "bold",
                    ...getResponsiveCellStyles(column.id)
                  }}
                >
                  {column.sortKey ? (
                    <TableSortLabel
                      active={searchData.sortField === column.sortKey}
                      direction={searchData.sortField === column.sortKey && searchData.sortDirection === "ASC" ? "asc" : "desc"}
                      onClick={() => handleSortRequest(column.sortKey!)}
                      sx={{
                        '& .MuiTableSortLabel-icon': {
                          color: searchData.sortField === column.sortKey ? 'primary.main' : 'inherit',
                          opacity: searchData.sortField === column.sortKey ? 1 : 0.4,
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
              <TableCell sx={{ fontWeight: "bold", padding: { xs: "10px 8px", md: "16px 12px" }, textAlign: "center" }}>Watchlist</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index} tabIndex={-1} hover>
                <TableCell
                  role="checkbox"
                  sx={{
                    cursor: "pointer",
                    color: 'primary.main',
                    fontWeight: 'bold',
                    padding: { xs: "12px 8px", md: "16px 12px" },
                    maxWidth: { xs: '140px', sm: 'none' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: { xs: 'nowrap', sm: 'normal' }
                  }}
                  onClick={() => showEtf(row)}
                >
                  {row.longName != null ? row.longName : row.shortName}
                </TableCell>
                <TableCell sx={getResponsiveCellStyles("fundSize")}>{row.fundSize}</TableCell>
                <TableCell sx={getResponsiveCellStyles("ter")}>{row.ter}</TableCell>
                <TableCell sx={getResponsiveCellStyles("y1Yield")}>{row.y1Yield}</TableCell>
                <TableCell sx={getResponsiveCellStyles("price")}>{row.regularMarketPrice}</TableCell>
                <TableCell sx={getResponsiveCellStyles("distribution")}>{row.type}</TableCell>
                <TableCell sx={getResponsiveCellStyles("isin")}>{row.isin}</TableCell>
                <TableCell sx={getResponsiveCellStyles("symbol")}>{row.symbol}</TableCell>
                <TableCell sx={{ padding: { xs: "8px", md: "12px" }, textAlign: "center" }}>
                  {row.watchlistId == null ? (
                    <Tooltip title="Aggiungi alla Watchlist" arrow>
                      <IconButton
                        onClick={() => addToWatchlist(row)}
                        sx={{
                          color: "success.main",
                          '&:hover': { backgroundColor: "success.lighter" }
                        }}
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Rimuovi dalla Watchlist" arrow>
                      <IconButton
                        onClick={() => removeFromWatchlist(row)}
                        sx={{
                          color: "error.main",
                          '&:hover': { backgroundColor: "error.lighter" }
                        }}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 0 && (
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          padding: '1.5rem 1rem 0.5rem 1rem'
        }}>

          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Showing {fromItem} to {toItem} of {totalItems} items
          </Typography>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => goToPage(1)}
                disabled={searchData.page === 1}
                sx={{ minWidth: '32px', padding: '4px' }}
              >
                {"<<"}
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => goToPage(searchData.page - 1)}
                disabled={searchData.page === 1}
                sx={{ minWidth: '32px', padding: '4px' }}
              >
                {"<"}
              </Button>

              {paginationRange.map((pageNumber, index) => {
                if (pageNumber === '...') {
                  return <Typography key={index} sx={{ padding: '0 4px' }}>...</Typography>;
                }
                return (
                  <Button
                    key={index}
                    variant={pageNumber === searchData.page ? "contained" : "outlined"}
                    size="small"
                    onClick={() => goToPage(pageNumber as number)}
                    sx={{
                      minWidth: '32px',
                      padding: '4px',
                      ...(pageNumber === searchData.page && {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': { backgroundColor: 'primary.dark' },
                      })
                    }}
                  >
                    {pageNumber}
                  </Button>
                );
              })}

              <Button
                variant="outlined"
                size="small"
                onClick={() => goToPage(searchData.page + 1)}
                disabled={searchData.page === totalPages}
                sx={{ minWidth: '32px', padding: '4px' }}
              >
                {">"}
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => goToPage(totalPages)}
                disabled={searchData.page === totalPages}
                sx={{ minWidth: '32px', padding: '4px' }}
              >
                {">>"}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};
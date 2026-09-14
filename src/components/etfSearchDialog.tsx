import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";

import { useState, useEffect } from "react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

import { NumericFormat } from "react-number-format";
import * as React from "react";

import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const PercentageFormat = React.forwardRef<HTMLInputElement, CustomProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value || "",
            },
          });
        }}
        valueIsNumericString
        decimalScale={2}
        decimalSeparator="."
        allowNegative={true}
        isAllowed={(values) => {
          const { floatValue } = values;
          return floatValue === undefined ? true : floatValue <= 100 && floatValue >= -100;
        }}
      />
    );
  },
);

const AmountFormat = React.forwardRef<HTMLInputElement, CustomProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value || "",
            },
          });
        }}
        valueIsNumericString
        decimalScale={2}
        decimalSeparator="."
        allowNegative={false}
      />
    );
  },
);

export const EtfSearchDialog = ({
  open,
  onClose,
  currentFilters,
  onApplyFilters,
}: any) => {
  const [localFilters, setLocalFilters] = useState<any>({ ...currentFilters });

  useEffect(() => {
    if (open) {
      setLocalFilters({ ...currentFilters });
    }
  }, [open, currentFilters]);

  const handleSearchSubmit = () => {
    const finalFilters: any = {
      ...localFilters,
      page: 1,
    };
    onApplyFilters(finalFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const cleared = Object.keys(localFilters).reduce((acc: any, key) => {
      acc[key] = "";
      return acc;
    }, {});
    setLocalFilters(cleared);
  };

  const handleInputChange = (field: keyof any, value: any) => {
    setLocalFilters((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="dialog-search-etf"
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: { xs: 1, sm: 2 },
            overflowY: "auto" 
          }
        }}
      >
        <DialogTitle id="dialog-search-etf" sx={{ pb: 1 }}>
          <Typography variant="h5" component="span" sx={{ fontWeight: "bold" }}>
            Search ETF
          </Typography>
        </DialogTitle>

        <DialogContent id="search-etf-content" sx={{ overflowY: "visible" }}>
          <Box sx={{ width: "100%", pt: 1 }}>
            <Stack spacing={2.5}>
              
              <TextField
                fullWidth
                label="Main Filter"
                variant="outlined"
                id="main-filter-id"
                value={localFilters.mainFilter || ""}
                onChange={(e) => handleInputChange("mainFilter", e.target.value)}
              />

              <TextField
                fullWidth
                select
                label="Distribution Type"
                value={localFilters.typeFilter || ""}
                onChange={(e) => handleInputChange("typeFilter", e.target.value)}
                variant="outlined"
              >
                <MenuItem value=""><em>All (No filter)</em></MenuItem>
                <MenuItem value="ACC">Accumulation</MenuItem>
                <MenuItem value="DIST">Distribution</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Sustainable"
                value={localFilters.sustainable || ""}
                onChange={(e) => handleInputChange("sustainable", e.target.value)}
                variant="outlined"
              >
                <MenuItem value=""><em>All (No filter)</em></MenuItem>
                <MenuItem value="true">YES</MenuItem>
                <MenuItem value="false">NO</MenuItem>
              </TextField>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DatePicker
                  label="First Trade Date From"
                  value={localFilters.firstTradeDateFrom ? dayjs(localFilters.firstTradeDateFrom) : null}
                  onChange={(newValue: Dayjs | null) => {
                    handleInputChange("firstTradeDateFrom", newValue ? newValue.format("YYYY-MM-DD") : null);
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="First Trade Date To"
                  value={localFilters.firstTradeDateTo ? dayjs(localFilters.firstTradeDateTo) : null}
                  onChange={(newValue: Dayjs | null) => {
                    handleInputChange("firstTradeDateTo", newValue ? newValue.format("YYYY-MM-DD") : null);
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="TER From (%)"
                  name="terFrom"
                  value={localFilters.terFrom || ""}
                  onChange={(e) => handleInputChange("terFrom", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
                <TextField
                  fullWidth
                  label="TER To (%)"
                  name="terTo"
                  value={localFilters.terTo || ""}
                  onChange={(e) => handleInputChange("terTo", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Price From"
                  name="priceFrom"
                  value={localFilters.priceFrom || ""}
                  onChange={(e) => handleInputChange("priceFrom", e.target.value)}
                  slotProps={{ input: { inputComponent: AmountFormat as any } }}
                />
                <TextField
                  fullWidth
                  label="Price To"
                  name="priceTo"
                  value={localFilters.priceTo || ""}
                  onChange={(e) => handleInputChange("priceTo", e.target.value)}
                  slotProps={{ input: { inputComponent: AmountFormat as any } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="d1 yield From (%)"
                  name="d1YieldFrom"
                  value={localFilters.d1YieldFrom || ""}
                  onChange={(e) => handleInputChange("d1YieldFrom", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
                <TextField
                  fullWidth
                  label="d1 yield To (%)"
                  name="d1YieldTo"
                  value={localFilters.d1YieldTo || ""}
                  onChange={(e) => handleInputChange("d1YieldTo", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="m1 yield From (%)"
                  name="m1YieldFrom"
                  value={localFilters.m1YieldFrom || ""}
                  onChange={(e) => handleInputChange("m1YieldFrom", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
                <TextField
                  fullWidth
                  label="m1 yield To (%)"
                  name="m1YieldTo"
                  value={localFilters.m1YieldTo || ""}
                  onChange={(e) => handleInputChange("m1YieldTo", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="y1 yield From (%)"
                  name="y1YieldFrom"
                  value={localFilters.y1YieldFrom || ""}
                  onChange={(e) => handleInputChange("y1YieldFrom", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
                <TextField
                  fullWidth
                  label="y1 yield To (%)"
                  name="y1YieldTo"
                  value={localFilters.y1YieldTo || ""}
                  onChange={(e) => handleInputChange("y1YieldTo", e.target.value)}
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Fund size from"
                  name="fundSizeFrom"
                  value={localFilters.fundSizeFrom || ""}
                  onChange={(e) => handleInputChange("fundSizeFrom", e.target.value)}
                  slotProps={{ input: { inputComponent: AmountFormat as any } }}
                />
                <TextField
                  fullWidth
                  label="Fund size to"
                  name="fundSizeTo"
                  value={localFilters.fundSizeTo || ""}
                  onChange={(e) => handleInputChange("fundSizeTo", e.target.value)}
                  slotProps={{ input: { inputComponent: AmountFormat as any } }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Market volume from"
                  name="marketVolumeFrom"
                  value={localFilters.marketVolumeFrom || ""}
                  onChange={(e) => handleInputChange("marketVolumeFrom", e.target.value)}
                  slotProps={{ input: { inputComponent: AmountFormat as any } }}
                />
                <TextField
                  fullWidth
                  label="Market volume to"
                  name="marketVolumeTo"
                  value={localFilters.marketVolumeTo || ""}
                  onChange={(e) => handleInputChange("marketVolumeTo", e.target.value)}
                  slotProps={{ input: { inputComponent: AmountFormat as any } }}
                />
              </Stack>

            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
          
          <Button 
            onClick={handleClearFilters}
            color="inherit" 
            startIcon={<RestartAltIcon />}
            sx={{ fontWeight: "bold", opacity: 0.8, '&:hover': { opacity: 1 } }}
          >
            Reset Filters
          </Button>
          
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} color="inherit" sx={{ fontWeight: "bold" }}>
              Cancel
            </Button>
            <Button
              onClick={handleSearchSubmit}
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              sx={{ fontWeight: "bold", px: 3 }}
            >
              Search
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
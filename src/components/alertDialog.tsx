import {
  Button, 
  Box, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select,
  Stack,
  Typography
} from '@mui/material';
import { FormControlLabel, Switch } from '@mui/material';
import * as React from 'react';
import { NumericFormat } from 'react-number-format';

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const yieldIntervalList = [
  { value: "D1", label: "1 day" },
  { value: "M1", label: "1 month" },
  { value: "M3", label: "3 months" },
  { value: "M6", label: "6 months" },
  { value: "Y1", label: "1 year" },
  { value: "Y3", label: "3 years" },
  { value: "Y5", label: "5 years" },
];

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

export const AlertDialog = (props: any) => {

  const handleAlertTypeChange = (event: any) => {
    const updatedAlert = { 
      ...props.editingAlert, 
      alertType: event.target.value as string 
    };
    props.setEditingAlert(updatedAlert);
  };

  const handleYieldIntervalChange = (event: any) => {
    const updatedAlert = { 
      ...props.editingAlert, 
      yieldInterval: event.target.value as string 
    };
    props.setEditingAlert(updatedAlert);
  };

  const handleSetActive = (event: any) => {
    const updatedAlert = { 
      ...props.editingAlert, 
      active: event.target.checked as boolean 
    };
    props.setEditingAlert(updatedAlert);
  };

  const handleClose = () => {
    props.setAlertDialogOpen(false);
  };

  const handleSave = () => {
    let threshold = 
      props.editingAlert.alertType === 'PRICE_ABOVE' || props.editingAlert.alertType === 'PRICE_UNDER' ? props.editingAlert.price :
      props.editingAlert.alertType === 'VOLUME_ABOVE' || props.editingAlert.alertType === 'VOLUME_UNDER' ? props.editingAlert.volume :
      props.editingAlert.alertType === 'YIELD_ABOVE' || props.editingAlert.alertType === 'YIELD_UNDER' ? props.editingAlert.etfYield : null;

    let data = {
      id: props.editingAlert.id,
      action: props.editingAlert.id === null ? "INSERT" : "UPDATE",
      active: !!props.editingAlert.active, 
      checkInterval: props.editingAlert.yieldInterval,
      conditionType: props.editingAlert.alertType,
      threshold: threshold
    };

    handleClose();
    props.handleSaveAlert(data);
  };

  const displayAlertTypeList = [...props.availableAlertTypeList];
  if (props.editingAlert?.alertType && !displayAlertTypeList.some(item => item.value === props.editingAlert.alertType)) {
    displayAlertTypeList.push({
      value: props.editingAlert.alertType,
      label: props.editingAlert.alertType.replace('_', ' ').toLowerCase()
    });
  }

  return (
    <Dialog 
      open={props.alertDialogOpen} 
      onClose={handleClose} 
      aria-labelledby='dialog-edit-alert' 
      aria-describedby='alert-edit-content'
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: { xs: 1, sm: 2 }
        }
      }}
    >
      <DialogTitle id='dialog-edit-alert' sx={{ pb: 1 }}>
        <Typography variant="h5" component="span" sx={{ fontWeight: "bold" }}>
          {props.editingAlert?.id ? "Edit Alert Condition" : "Create New Alert"}
        </Typography>
      </DialogTitle>
      
      <DialogContent id='alert-edit-content'>
        <Box sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            
            <FormControl fullWidth>
              <InputLabel id="alert-type-label">Alert Type</InputLabel>
              <Select
                labelId="alert-type-label"
                id="alert-type-id"
                value={props.editingAlert.alertType || ''}
                label="Alert Type"
                onChange={handleAlertTypeChange}
                disabled={props.editingAlert?.id !== null}
              >
                {displayAlertTypeList.map((row: any, index: number) => (
                  <MenuItem key={index} value={row.value}>{row.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                bgcolor: "action.hover", 
                p: 1.5, 
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider"
              }}
            >
              <FormControlLabel 
                control={
                  <Switch 
                    checked={!!props.editingAlert.active} 
                    color="primary" 
                    onChange={handleSetActive} 
                  />
                } 
                label={
                  <Typography sx={{ fontWeight: 500, ml: 1 }}>
                    Enable Alert Activation
                  </Typography>
                } 
              />
            </Box>

            {(props.editingAlert.alertType === 'PRICE_ABOVE' || props.editingAlert.alertType === 'PRICE_UNDER') && (
              <TextField 
                fullWidth 
                label='Price Threshold' 
                variant="outlined"
                slotProps={{ input: { inputComponent: AmountFormat as any } }}
                value={props.editingAlert.price || ''} 
                onChange={(e: any) => {
                  props.setEditingAlert({ ...props.editingAlert, price: e.target.value });
                }}
              />
            )}
            
            {(props.editingAlert.alertType === 'VOLUME_ABOVE' || props.editingAlert.alertType === 'VOLUME_UNDER') && (
              <TextField 
                fullWidth 
                label='Volume Threshold' 
                variant="outlined"
                slotProps={{ input: { inputComponent: AmountFormat as any } }}
                value={props.editingAlert.volume || ''} 
                onChange={(e: any) => {
                  props.setEditingAlert({ ...props.editingAlert, volume: e.target.value });
                }}
              />
            )}

            {(props.editingAlert.alertType === 'YIELD_ABOVE' || props.editingAlert.alertType === 'YIELD_UNDER') && (
              <Stack spacing={2.5}>
                <TextField 
                  fullWidth 
                  label='Yield % Threshold' 
                  variant="outlined"
                  slotProps={{ input: { inputComponent: PercentageFormat as any } }}
                  value={props.editingAlert.etfYield || ''} 
                  onChange={(e: any) => {
                    props.setEditingAlert({ ...props.editingAlert, etfYield: e.target.value });
                  }}
                />
                <FormControl fullWidth>
                  <InputLabel id="yield-interval-label">Interval</InputLabel>
                  <Select
                    labelId="yield-interval-label"
                    id="yield-interval-id"
                    value={props.editingAlert.yieldInterval || ''}
                    label="Interval"
                    onChange={handleYieldIntervalChange}
                  >
                    {yieldIntervalList.map((row: any, index: number) => (
                      <MenuItem key={index} value={row.value}>{row.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}

          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        <Button 
          onClick={handleClose}
          color="inherit"
          sx={{ fontWeight: "bold" }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!props.editingAlert.alertType}
          sx={{ fontWeight: "bold", px: 3 }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
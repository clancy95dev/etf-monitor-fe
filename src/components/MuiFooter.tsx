import { Box, Typography, Container } from '@mui/material';

export const MuiFooter = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto', 
        backgroundColor: 'background.paper',
        borderTop: '1px solid #303b4e', 
        textAlign: 'center'
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} ETF MONITOR APP. All rights reserved. Market data delayed or synthetic.
        </Typography>
      </Container>
    </Box>
  );
};
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  People,
  Settings,
  Logout,
  AccountCircle,
  Add,
  CalendarToday,
  Person,
  Shield,
  CheckCircle,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Eksempeldata - i produksjon vil dette komme fra API
  const kommendeProduksjoner = [
    {
      id: 1,
      navn: 'Sommershow 2025',
      dato: '15. juni 2025',
      status: 'Planlagt',
      statusColor: 'success' as const,
      deltakere: 12,
    },
    {
      id: 2,
      navn: 'Høstkonsert',
      dato: '20. september 2025',
      status: 'Planlagt',
      statusColor: 'success' as const,
      deltakere: 8,
    },
    {
      id: 3,
      navn: 'Julegalla',
      dato: '18. desember 2025',
      status: 'Under planlegging',
      statusColor: 'warning' as const,
      deltakere: 5,
    },
  ];

  const nyligGjennomfort = [
    {
      id: 1,
      navn: 'Vårkonsert 2025',
      dato: '12.3.2025',
    },
    {
      id: 2,
      navn: 'Påskeshow',
      dato: '18.4.2025',
    },
  ];

  const hurtigvalg = [
    {
      navn: 'Planlegg ny produksjon',
      ikon: <CalendarToday />,
      farge: '#e1bee7',
      onClick: () => console.log('Planlegg nytt show'),
    },
    {
      navn: 'Se alle personer',
      ikon: <Person />,
      farge: '#e1bee7',
      onClick: () => console.log('Se alle personer'),
    },
    {
      navn: 'Administrer kompetanser',
      ikon: <Shield />,
      farge: '#c8e6c9',
      onClick: () => console.log('Administrer kompetanser'),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Voluplan
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user?.firstName} {user?.lastName}
            </Typography>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <AccountCircle sx={{ mr: 1 }} /> Profil
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Settings sx={{ mr: 1 }} /> Innstillinger
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} /> Logg ut
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Kommende show */}
        <Paper sx={{ p: 3, mb: 3, boxShadow: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Fremtidige produksjoner
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Ny produksjon
            </Button>
          </Box>
          
          <List>
            {kommendeProduksjoner.map((produksjon, index) => (
              <React.Fragment key={produksjon.id}>
                <ListItem
                  sx={{
                    py: 2,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                  }}
                >
                  <ListItemIcon>
                    <CalendarToday color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {produksjon.navn}
                        </Typography>
                        <Chip
                          label={produksjon.status}
                          color={produksjon.statusColor}
                          size="small"
                          sx={{ height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {produksjon.dato}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <People fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {produksjon.deltakere} personer
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ChevronRight color="action" />
                </ListItem>
                {index < kommendeProduksjoner.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Hurtigvalg */}
        <Paper sx={{ p: 3, mb: 3, boxShadow: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Hurtigvalg
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {hurtigvalg.map((valg, index) => (
              <Button
                key={index}
                variant="text"
                startIcon={
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      backgroundColor: valg.farge,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1,
                    }}
                  >
                    {valg.ikon}
                  </Box>
                }
                onClick={valg.onClick}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.5,
                  px: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                {valg.navn}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* Nylig gjennomført */}
        <Paper sx={{ p: 3, boxShadow: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Nylig gjennomført
          </Typography>
          <List>
            {nyligGjennomfort.map((produksjon, index) => (
              <React.Fragment key={produksjon.id}>
                <ListItem sx={{ py: 1 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={produksjon.navn}
                    secondary={produksjon.dato}
                  />
                </ListItem>
                {index < nyligGjennomfort.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;


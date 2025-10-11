import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Alert,
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
import { produksjonAPI, Produksjon } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const [kommendeProduksjoner, setKommendeProduksjoner] = useState<Produksjon[]>([]);
  const [nyligGjennomfort, setNyligGjennomfort] = useState<Produksjon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduksjoner = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Hent kommende produksjoner
        const kommendeData = await produksjonAPI.getAll({ kommende: true, publisert: true });
        setKommendeProduksjoner(kommendeData.produksjoner);
        
        // Hent gjennomførte produksjoner
        const gjennomfortData = await produksjonAPI.getAll({ gjennomfort: true, publisert: true });
        setNyligGjennomfort(gjennomfortData.produksjoner.slice(0, 5)); // Vis kun de 5 siste
      } catch (err: any) {
        console.error('Feil ved henting av produksjoner:', err);
        setError('Kunne ikke laste produksjoner. Vennligst prøv igjen.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduksjoner();
  }, []);

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

  const formatDato = (tidString: string) => {
    const dato = new Date(tidString);
    return dato.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDatoKort = (tidString: string) => {
    const dato = new Date(tidString);
    return dato.toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && (
          <>
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
              
              {kommendeProduksjoner.length === 0 ? (
                <Alert severity="info">Ingen fremtidige produksjoner planlagt</Alert>
              ) : (
                <List>
                  {kommendeProduksjoner.map((produksjon, index) => (
                    <React.Fragment key={produksjon.id}>
                      <ListItem
                        onClick={() => navigate(`/produksjon/${produksjon.id}`)}
                        sx={{
                          py: 2,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          borderRadius: 1,
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
                              {produksjon.kategori_navn && (
                                <Chip
                                  label={produksjon.kategori_navn}
                                  color="primary"
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatDato(produksjon.tid)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <People fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {produksjon.antall_personer} personer
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
              )}
            </Paper>
          </>
        )}

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
        {!loading && !error && (
          <Paper sx={{ p: 3, boxShadow: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Nylig gjennomført
            </Typography>
            {nyligGjennomfort.length === 0 ? (
              <Alert severity="info">Ingen gjennomførte produksjoner ennå</Alert>
            ) : (
              <List>
                {nyligGjennomfort.map((produksjon, index) => (
                  <React.Fragment key={produksjon.id}>
                    <ListItem 
                      onClick={() => navigate(`/produksjon/${produksjon.id}`)}
                      sx={{ 
                        py: 1.5,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderRadius: 1,
                      }}
                    >
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={produksjon.navn}
                        secondary={formatDatoKort(produksjon.tid)}
                      />
                      <ChevronRight color="action" />
                    </ListItem>
                    {index < nyligGjennomfort.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;


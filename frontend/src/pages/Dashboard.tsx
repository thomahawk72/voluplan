import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Typography,
} from '@mui/material';
import {
  Add,
  CalendarToday,
  ChevronRight,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { produksjonAPI, Produksjon } from '../services/api';
import NyProduksjonDialog from '../components/production/NyProduksjonDialog';
import AppHeader from '../components/layout/AppHeader';

type PublisertFilter = 'alle' | 'publisert' | 'upublisert';
type TidsFilter = 'fremtidige' | 'tidligere';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [produksjoner, setProduksjoner] = useState<Produksjon[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publisertFilter, setPublisertFilter] = useState<PublisertFilter>('alle');
  const [tidsFilter, setTidsFilter] = useState<TidsFilter>('fremtidige');
  const [nyProduksjonOpen, setNyProduksjonOpen] = useState(false);

  useEffect(() => {
    const fetchProduksjoner = async () => {
      try {
        // Ved filterendring (ikke første lasting): vis subtle filtering state
        if (!initialLoading) {
          setIsFiltering(true);
        }
        setError(null);
        
        // Bygg filter-objekt basert på valgte filtre
        const filterParams: any = {};
        
        // Tidsfilter
        if (tidsFilter === 'fremtidige') {
          filterParams.kommende = true;
        } else {
          filterParams.gjennomfort = true;
        }
        
        // Publisert-filter
        if (publisertFilter === 'publisert') {
          filterParams.publisert = true;
        } else if (publisertFilter === 'upublisert') {
          filterParams.publisert = false;
        }
        // Hvis 'alle' er valgt, sender vi ikke publisert-parameter
        
        // Hent produksjoner med filtre
        const data = await produksjonAPI.getAll(filterParams);
        setProduksjoner(data.produksjoner);
      } catch (err: any) {
        console.error('Feil ved henting av produksjoner:', err);
        setError('Kunne ikke laste produksjoner. Vennligst prøv igjen.');
      } finally {
        setInitialLoading(false);
        setIsFiltering(false);
      }
    };

    fetchProduksjoner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publisertFilter, tidsFilter]);

  const handleNyProduksjonSuccess = () => {
    // Refetch produksjoner etter vellykket opprettelse
    setInitialLoading(false); // Unngå full loader
    const fetchProduksjoner = async () => {
      try {
        setError(null);
        const filterParams: any = {};
        
        if (tidsFilter === 'fremtidige') {
          filterParams.kommende = true;
        } else {
          filterParams.gjennomfort = true;
        }
        
        if (publisertFilter === 'publisert') {
          filterParams.publisert = true;
        } else if (publisertFilter === 'upublisert') {
          filterParams.publisert = false;
        }
        
        const data = await produksjonAPI.getAll(filterParams);
        setProduksjoner(data.produksjoner);
      } catch (err: any) {
        console.error('Feil ved henting av produksjoner:', err);
        setError('Kunne ikke laste produksjoner. Vennligst prøv igjen.');
      }
    };
    fetchProduksjoner();
  };

  const formatDato = (tidString: string) => {
    const dato = new Date(tidString);
    return dato.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };


  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppHeader />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {initialLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {!initialLoading && !error && (
          <>
            {/* Produksjoner */}
            <Paper sx={{ p: 3, mb: 3, boxShadow: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Produksjoner
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setNyProduksjonOpen(true)}
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
              
              {/* Filtre */}
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Tidsfilter */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ToggleButtonGroup
                    value={tidsFilter}
                    exclusive
                    onChange={(_, newFilter) => {
                      if (newFilter !== null) {
                        setTidsFilter(newFilter);
                      }
                    }}
                    size="small"
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <ToggleButton value="fremtidige">
                      Fremtidige
                    </ToggleButton>
                    <ToggleButton value="tidligere">
                      Tidligere
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                {/* Publisert-filter */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ToggleButtonGroup
                    value={publisertFilter}
                    exclusive
                    onChange={(_, newFilter) => {
                      if (newFilter !== null) {
                        setPublisertFilter(newFilter);
                      }
                    }}
                    size="small"
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <ToggleButton value="alle">
                      Alle
                    </ToggleButton>
                    <ToggleButton value="publisert">
                      <Visibility sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                      Publisert
                    </ToggleButton>
                    <ToggleButton value="upublisert">
                      <VisibilityOff sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                      Upublisert
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
              
              <Box
                sx={{
                  opacity: isFiltering ? 0.5 : 1,
                  transition: 'opacity 0.2s ease-in-out',
                  pointerEvents: isFiltering ? 'none' : 'auto',
                }}
              >
                {produksjoner.length === 0 ? (
                  <Alert severity="info">
                    Ingen {publisertFilter === 'alle' ? '' : publisertFilter === 'publisert' ? 'publiserte ' : 'upubliserte '}
                    {tidsFilter === 'fremtidige' ? 'fremtidige' : 'tidligere'} produksjoner funnet
                  </Alert>
                ) : (
                  <List>
                    {produksjoner.map((produksjon, index) => (
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
                                <Typography sx={{ fontWeight: 500 }}>
                                  {produksjon.navn}
                                </Typography>
                                {produksjon.publisert ? (
                                  <Chip 
                                    icon={<Visibility sx={{ fontSize: '1rem' }} />}
                                    label="Publisert" 
                                    size="small" 
                                    color="success"
                                    sx={{ height: 24 }}
                                  />
                                ) : (
                                  <Chip 
                                    icon={<VisibilityOff sx={{ fontSize: '1rem' }} />}
                                    label="Upublisert" 
                                    size="small" 
                                    color="default"
                                    sx={{ height: 24 }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <React.Fragment>
                                {formatDato(produksjon.tid)} • {produksjon.antall_personer} personer
                                {produksjon.kategori_navn && ` • ${produksjon.kategori_navn}`}
                              </React.Fragment>
                            }
                            secondaryTypographyProps={{
                              component: 'span'
                            }}
                          />
                          <ChevronRight color="action" />
                        </ListItem>
                        {index < produksjoner.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Container>

      {/* Ny Produksjon Dialog */}
      <NyProduksjonDialog
        open={nyProduksjonOpen}
        onClose={() => setNyProduksjonOpen(false)}
        onSuccess={handleNyProduksjonSuccess}
      />
    </Box>
  );
};

export default Dashboard;


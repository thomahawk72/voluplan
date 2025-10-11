import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Avatar,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Collapse,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  Category,
  AccessTime,
  Groups,
  Schedule,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { produksjonAPI, Produksjon, Bemanning, ProduksjonsPlan } from '../services/api';

const ProductionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [produksjon, setProduksjon] = useState<Produksjon | null>(null);
  const [bemanning, setBemanning] = useState<Bemanning[]>([]);
  const [plan, setPlan] = useState<ProduksjonsPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for å vise/skjule seksjoner
  const [visMedarbeidere, setVisMedarbeidere] = useState(false);
  const [visPlan, setVisPlan] = useState(false);
  const [visOppmote, setVisOppmote] = useState(false);
  const [apneKategorier, setApneKategorier] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Hent produksjon
        const prodData = await produksjonAPI.getById(Number(id));
        setProduksjon(prodData.produksjon);
        
        // Hent bemanning
        const bemanningData = await produksjonAPI.getBemanning(Number(id));
        setBemanning(bemanningData.bemanning);
        
        // Hent plan hvis den finnes
        if (prodData.produksjon.plan_id) {
          try {
            const planData = await produksjonAPI.getPlan(prodData.produksjon.plan_id);
            setPlan(planData.plan);
          } catch (err) {
            console.error('Kunne ikke hente plan:', err);
          }
        }
      } catch (err: any) {
        console.error('Feil ved lasting av produksjon:', err);
        setError('Kunne ikke laste produksjonsdata. Vennligst prøv igjen.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDato = (tidString: string) => {
    const dato = new Date(tidString);
    return dato.toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleKategori = (kategoriNavn: string) => {
    setApneKategorier(prev => {
      const nySet = new Set(prev);
      if (nySet.has(kategoriNavn)) {
        nySet.delete(kategoriNavn);
      } else {
        nySet.add(kategoriNavn);
      }
      return nySet;
    });
  };

  const formatTid = (tidString: string) => {
    const dato = new Date(tidString);
    return dato.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'bekreftet':
        return 'success';
      case 'planlagt':
        return 'warning';
      case 'avlyst':
        return 'error';
      default:
        return 'default';
    }
  };

  // Beregn bemanningsstatistikk
  const bemanningStats = {
    totalt: bemanning.length,
    bekreftet: bemanning.filter(p => p.status === 'bekreftet').length,
    planlagt: bemanning.filter(p => p.status === 'planlagt').length,
    avlyst: bemanning.filter(p => p.status === 'avlyst').length,
    ikkeSvart: bemanning.filter(p => !p.status || p.status === 'ikke_svart').length,
  };

  // Grupper bemanning per talent kategori (øverste nivå)
  const bemanningPerKategori = bemanning.reduce((acc, person) => {
    // Bruk kun øverste nivå av kategori som gruppe-navn
    const kategoriNavn = person.talent_kategori?.split(' - ')[0] || 'Ikke kategorisert';
    if (!acc[kategoriNavn]) {
      acc[kategoriNavn] = [];
    }
    acc[kategoriNavn].push(person);
    return acc;
  }, {} as Record<string, Bemanning[]>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !produksjon) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Produksjon ikke funnet'}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {produksjon.navn}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Hovedinformasjon */}
        <Paper
          sx={{
            p: 4,
            mb: 3,
            boxShadow: 3,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {produksjon.navn}
            </Typography>
            
            {/* Dato og tid */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday color="primary" />
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {formatDato(produksjon.tid)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="primary" />
                <Typography variant="h6">
                  {formatTid(produksjon.tid)}
                </Typography>
              </Box>
            </Box>

            {/* Kategori */}
            {produksjon.kategori_navn && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Category color="action" />
                <Chip
                  label={produksjon.kategori_navn}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            )}

            {/* Beskrivelse */}
            {produksjon.beskrivelse && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Om produksjonen
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  {produksjon.beskrivelse}
                </Typography>
              </Box>
            )}

            {/* Hurtiglenker til seksjoner */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant={visMedarbeidere ? 'contained' : 'outlined'}
                startIcon={<Groups />}
                onClick={() => setVisMedarbeidere(!visMedarbeidere)}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Medarbeidere ({bemanningStats.totalt})
              </Button>
              <Button
                variant={visPlan ? 'contained' : 'outlined'}
                startIcon={<CalendarToday />}
                onClick={() => setVisPlan(!visPlan)}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Plan
              </Button>
              <Button
                variant={visOppmote ? 'contained' : 'outlined'}
                startIcon={<Schedule />}
                onClick={() => setVisOppmote(!visOppmote)}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Oppmøtetider
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tre informasjonsbolker */}
        {visMedarbeidere && (
          <Box sx={{ mb: 3 }}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Groups color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Medarbeidere
                  </Typography>
                </Box>
                
                {/* Forbedret statistikk med oversikt */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 2, 
                  mb: 3, 
                  p: 3,
                  bgcolor: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: 2,
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                      {bemanningStats.totalt}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Totalt kalt inn
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                      {bemanningStats.bekreftet}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bekreftet
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                      {bemanningStats.planlagt}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ikke svart
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                      {bemanningStats.avlyst}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avslått
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {bemanning.length === 0 ? (
                  <Alert severity="info">Ingen medarbeidere er lagt til ennå</Alert>
                ) : (
                  <Box>
                    {Object.entries(bemanningPerKategori).map(([kategori, personer]) => (
                      <Box key={kategori} sx={{ mb: 2 }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            p: 2,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'grey.100' }
                          }}
                          onClick={() => toggleKategori(kategori)}
                        >
                          <IconButton size="small">
                            {apneKategorier.has(kategori) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                          <Typography sx={{ fontWeight: 600 }}>
                            {kategori}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                            <Chip
                              label={`${personer.length} personer`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                            <Chip
                              label={`${personer.filter(p => p.status === 'bekreftet').length} bekreftet`}
                              size="small"
                              color="success"
                            />
                          </Box>
                        </Box>
                        <Collapse in={apneKategorier.has(kategori)}>
                          {/* Kompakt tabell for kategorien */}
                          <Box sx={{ overflow: 'hidden', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'auto 1fr auto auto', 
                              bgcolor: 'grey.50',
                              p: 1,
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              color: 'text.secondary'
                            }}>
                              <Box sx={{ px: 2 }}>Avatar</Box>
                              <Box>Navn & Kompetanse</Box>
                              <Box sx={{ textAlign: 'center' }}>Status</Box>
                              <Box sx={{ textAlign: 'center', px: 1 }}>Handlinger</Box>
                            </Box>
                            {personer.map((person, index) => (
                              <Box 
                                key={person.id}
                                sx={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'auto 1fr auto auto',
                                  alignItems: 'center',
                                  p: 1,
                                  borderTop: index > 0 ? '1px solid' : 'none',
                                  borderColor: 'divider',
                                  '&:hover': { bgcolor: 'grey.50' }
                                }}
                              >
                                <Box sx={{ px: 2 }}>
                                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                                    {person.first_name[0]}{person.last_name[0]}
                                  </Avatar>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                    {person.first_name} {person.last_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {person.talent_navn}
                                  </Typography>
                                  {person.notater && (
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block' }}>
                                      "{person.notater}"
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Chip
                                    label={person.status}
                                    color={getStatusColor(person.status)}
                                    size="small"
                                    sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, px: 1 }}>
                                  <IconButton size="small" color="primary">
                                    <Groups fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" color="default">
                                    <Schedule fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Plan */}
        {visPlan && (
          <Box sx={{ mb: 3 }}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarToday color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Produksjonsplan
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {plan ? (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      {plan.navn}
                    </Typography>
                    {plan.beskrivelse && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {plan.beskrivelse}
                      </Typography>
                    )}
                    {produksjon && (
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Starttid
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {new Date(produksjon.tid).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        {plan.start_dato && plan.slutt_dato && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Varighet
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {Math.ceil((new Date(plan.slutt_dato).getTime() - new Date(plan.start_dato).getTime()) / (1000 * 60 * 60 * 24))} dager
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                  ) : produksjon.plan_navn ? (
                    <Typography variant="body2" color="text.secondary">
                      {produksjon.plan_navn}
                    </Typography>
                  ) : (
                    <Alert severity="info">Ingen produksjonsplan tilknyttet</Alert>
                  )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Oppmøtetider */}
        {visOppmote && (
          <Box sx={{ mb: 3 }}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Schedule color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Oppmøtetider
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {/* Placeholder for oppmøtetider */}
                <Alert severity="info" sx={{ mb: 2 }}>
                  Oppmøtetider kommer snart!
                </Alert>
                
                <Typography variant="body2" color="text.secondary">
                  Her vil du se når ulike team skal møte opp for rigging, prøver og forestilling.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProductionDetail;


import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { ArrowBack, AccessTime } from '@mui/icons-material';
import { useProductionData } from '../hooks/useProductionData';
import ProductionHeader from '../components/production/ProductionHeader';
import EmployeeCard from '../components/production/EmployeeCard';
import PlanCard from '../components/production/PlanCard';

const ProductionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    produksjon,
    bemanning,
    talentBehov,
    plan,
    loading,
    error,
    bemanningStats,
    bemanningPerKategori,
    refresh,
  } = useProductionData(id);
  
  const [visMedarbeidere, setVisMedarbeidere] = useState(false);
  const [visPlan, setVisPlan] = useState(false);
  const [visOppmote, setVisOppmote] = useState(false);

  const formatDato = (tidString: string) => {
    const dato = new Date(tidString);
    return dato.toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'bekreftet':
        return 'Bekreftet';
      case 'planlagt':
        return 'Planlagt';
      case 'avlyst':
        return 'Avslått';
      default:
        return 'Ikke svart';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !produksjon) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Produksjon ikke funnet'}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 4 }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Produksjonsdetaljer
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ProductionHeader
          produksjon={produksjon}
          bemanningStats={bemanningStats}
          visMedarbeidere={visMedarbeidere}
          visPlan={visPlan}
          visOppmote={visOppmote}
          onToggleMedarbeidere={() => setVisMedarbeidere(!visMedarbeidere)}
          onTogglePlan={() => setVisPlan(!visPlan)}
          onToggleOppmote={() => setVisOppmote(!visOppmote)}
          formatDato={formatDato}
          formatTid={formatTid}
        />

        <EmployeeCard
          visible={visMedarbeidere}
          produksjonId={parseInt(id || '0')}
          bemanningStats={bemanningStats}
          bemanningPerKategori={bemanningPerKategori}
          talentBehov={talentBehov}
          onRefresh={refresh}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />

        <PlanCard
          visible={visPlan}
          plan={plan}
          produksjon={produksjon}
        />

        {visOppmote && (
          <Box sx={{ mb: 3 }}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AccessTime color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Oppmøtetider
                  </Typography>
                </Box>
                <Alert severity="info">Oppmøtetider kommer snart</Alert>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProductionDetail;

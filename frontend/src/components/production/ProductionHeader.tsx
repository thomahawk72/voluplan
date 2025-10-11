import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { CalendarToday, AccessTime, Category, Groups, Schedule } from '@mui/icons-material';
import { Produksjon } from '../../services/api';

interface ProductionHeaderProps {
  produksjon: Produksjon;
  bemanningStats: {
    totalt: number;
    bekreftet: number;
    planlagt: number;
    avlyst: number;
    ikkeSvart: number;
  };
  visMedarbeidere: boolean;
  visPlan: boolean;
  visOppmote: boolean;
  onToggleMedarbeidere: () => void;
  onTogglePlan: () => void;
  onToggleOppmote: () => void;
  formatDato: (tid: string) => string;
  formatTid: (tid: string) => string;
}

const ProductionHeader: React.FC<ProductionHeaderProps> = ({
  produksjon,
  bemanningStats,
  visMedarbeidere,
  visPlan,
  visOppmote,
  onToggleMedarbeidere,
  onTogglePlan,
  onToggleOppmote,
  formatDato,
  formatTid,
}) => {
  return (
    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 2, mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {produksjon.navn}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">Dato</Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formatDato(produksjon.tid)}
          </Typography>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">Tid</Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formatTid(produksjon.tid)}
          </Typography>
        </Box>

        {produksjon.kategori_navn && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Category fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">Kategori</Typography>
            </Box>
            <Chip label={produksjon.kategori_navn} color="primary" size="small" />
          </Box>
        )}
      </Box>

      {produksjon.beskrivelse && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {produksjon.beskrivelse}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant={visMedarbeidere ? 'contained' : 'outlined'}
          startIcon={<Groups />}
          onClick={onToggleMedarbeidere}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Medarbeidere ({bemanningStats.totalt})
        </Button>
        <Button
          variant={visPlan ? 'contained' : 'outlined'}
          startIcon={<Schedule />}
          onClick={onTogglePlan}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Plan
        </Button>
        <Button
          variant={visOppmote ? 'contained' : 'outlined'}
          startIcon={<AccessTime />}
          onClick={onToggleOppmote}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Oppmøtetider
        </Button>
      </Box>
    </Box>
  );
};

export default ProductionHeader;


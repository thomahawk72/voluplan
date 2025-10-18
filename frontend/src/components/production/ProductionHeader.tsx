import React, { useState } from 'react';
import { Box, Typography, Chip, Button, TextField, IconButton } from '@mui/material';
import { CalendarToday, AccessTime, Category, Groups, Schedule, Edit, Check, Close } from '@mui/icons-material';
import { Produksjon, produksjonAPI } from '../../services/api';

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
  const [editMode, setEditMode] = useState(false);
  const [editedTid, setEditedTid] = useState(produksjon.tid);
  const [editedPlassering, setEditedPlassering] = useState(produksjon.plassering || '');
  const [editedBeskrivelse, setEditedBeskrivelse] = useState(produksjon.beskrivelse || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await produksjonAPI.updateProduksjon(produksjon.id, {
        tid: editedTid,
        plassering: editedPlassering,
        beskrivelse: editedBeskrivelse,
      });
      setEditMode(false);
      window.location.reload(); // Refresh for å hente oppdatert data
    } catch (error) {
      console.error('Kunne ikke lagre endringer:', error);
      alert('Kunne ikke lagre endringer');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTid(produksjon.tid);
    setEditedPlassering(produksjon.plassering || '');
    setEditedBeskrivelse(produksjon.beskrivelse || '');
    setEditMode(false);
  };
  return (
    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {produksjon.navn}
        </Typography>
        {!editMode ? (
          <IconButton onClick={() => setEditMode(true)} color="primary" title="Rediger detaljer">
            <Edit />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleSave} color="success" disabled={saving} title="Lagre">
              <Check />
            </IconButton>
            <IconButton onClick={handleCancel} color="error" disabled={saving} title="Avbryt">
              <Close />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">Dato og tid</Typography>
          </Box>
          {editMode ? (
            <TextField
              type="datetime-local"
              value={editedTid.slice(0, 16)}
              onChange={(e) => setEditedTid(e.target.value)}
              size="small"
              fullWidth
            />
          ) : (
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formatDato(produksjon.tid)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                kl. {formatTid(produksjon.tid)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">Plassering</Typography>
          </Box>
          {editMode ? (
            <TextField
              value={editedPlassering}
              onChange={(e) => setEditedPlassering(e.target.value)}
              placeholder="F.eks. Hovedscene"
              size="small"
              fullWidth
            />
          ) : (
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {produksjon.plassering || 'Ikke angitt'}
            </Typography>
          )}
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

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Beskrivelse
        </Typography>
        {editMode ? (
          <TextField
            value={editedBeskrivelse}
            onChange={(e) => setEditedBeskrivelse(e.target.value)}
            placeholder="Beskrivelse av produksjonen"
            multiline
            rows={2}
            fullWidth
            size="small"
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {produksjon.beskrivelse || 'Ingen beskrivelse'}
          </Typography>
        )}
      </Box>

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


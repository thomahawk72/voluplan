import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Paper,
  Stack,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  DragIndicator,
  ExpandMore,
  ChevronRight,
  Schedule,
} from '@mui/icons-material';
import { produksjonAPI } from '../../services/api';

interface PlanMalElement {
  id: number;
  kategori_id: number;
  type: 'overskrift' | 'hendelse';
  navn: string;
  varighet_minutter: number | null;
  parent_id: number | null;
  rekkefølge: number;
}

interface Props {
  kategoriId: number;
  onSave: () => void;
}

const PlanMalEditor: React.FC<Props> = ({ kategoriId, onSave }) => {
  const [elements, setElements] = useState<PlanMalElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'overskrift' | 'hendelse'>('overskrift');
  const [editingElement, setEditingElement] = useState<PlanMalElement | null>(null);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  
  // Form state
  const [navn, setNavn] = useState('');
  const [varighet, setVarighetValue] = useState(5);
  
  // Expandable overskrifter
  const [expandedHeaders, setExpandedHeaders] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPlanMal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategoriId]);

  const fetchPlanMal = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await produksjonAPI.getPlanMal(kategoriId);
      setElements(data.planMal);
      // Auto-expand all headers initially
      const headerIds = data.planMal
        .filter((el: PlanMalElement) => el.type === 'overskrift')
        .map((el: PlanMalElement) => el.id);
      setExpandedHeaders(new Set(headerIds));
    } catch (err: any) {
      console.error('Fetch plan-mal error:', err);
      setError('Kunne ikke laste plan-mal');
    } finally {
      setLoading(false);
    }
  };

  const toggleHeader = (headerId: number) => {
    setExpandedHeaders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headerId)) {
        newSet.delete(headerId);
      } else {
        newSet.add(headerId);
      }
      return newSet;
    });
  };

  const openOverskriftDialog = (parentId: number | null = null) => {
    setDialogMode('overskrift');
    setCurrentParentId(parentId);
    setEditingElement(null);
    setNavn('');
    setDialogOpen(true);
  };

  const openHendelseDialog = (parentId: number) => {
    setDialogMode('hendelse');
    setCurrentParentId(parentId);
    setEditingElement(null);
    setNavn('');
    setVarighetValue(5);
    setDialogOpen(true);
  };

  const openEditDialog = (element: PlanMalElement) => {
    setDialogMode(element.type);
    setEditingElement(element);
    setNavn(element.navn);
    if (element.type === 'hendelse' && element.varighet_minutter) {
      setVarighetValue(element.varighet_minutter);
    }
    setCurrentParentId(element.parent_id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      if (!navn.trim()) {
        setError('Navn er påkrevd');
        return;
      }

      if (editingElement) {
        // Update existing element
        await produksjonAPI.updatePlanMalElement(kategoriId, editingElement.id, {
          navn: navn.trim(),
          ...(dialogMode === 'hendelse' && { varighetMinutter: varighet }),
        });
        setSuccess('Element oppdatert');
      } else {
        // Create new element
        const nextRekkefølge = getNextRekkefølge(currentParentId);
        await produksjonAPI.addPlanMalElement(kategoriId, {
          type: dialogMode,
          navn: navn.trim(),
          ...(dialogMode === 'hendelse' && currentParentId !== null && { 
            varighetMinutter: varighet,
            parentId: currentParentId 
          }),
          rekkefølge: nextRekkefølge,
        });
        setSuccess(`${dialogMode === 'overskrift' ? 'Overskrift' : 'Hendelse'} lagt til`);
      }

      setDialogOpen(false);
      await fetchPlanMal();
      onSave();
      
      // Clear success after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Kunne ikke lagre');
    }
  };

  const handleDelete = async (elementId: number) => {
    if (!window.confirm('Er du sikker på at du vil slette dette elementet?')) {
      return;
    }

    try {
      setError(null);
      await produksjonAPI.removePlanMalElement(kategoriId, elementId);
      setSuccess('Element slettet');
      await fetchPlanMal();
      onSave();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('Kunne ikke slette element');
    }
  };

  const getNextRekkefølge = (parentId: number | null): number => {
    const siblings = elements.filter(el => {
      if (parentId === null) {
        return el.type === 'overskrift';
      }
      return el.parent_id === parentId;
    });
    return siblings.length;
  };

  const getHendelserForOverskrift = (overskriftId: number): PlanMalElement[] => {
    return elements.filter(el => el.parent_id === overskriftId);
  };

  const overskrifter = elements.filter(el => el.type === 'overskrift');

  const formatVarighet = (minutter: number): string => {
    const timer = Math.floor(minutter / 60);
    const min = minutter % 60;
    if (timer > 0) {
      return `${timer}t ${min}min`;
    }
    return `${min} min`;
  };

  if (loading) {
    return <Typography>Laster plan-mal...</Typography>;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openOverskriftDialog()}
          color="primary"
        >
          Legg til overskrift
        </Button>
      </Box>

      {/* Plan-mal elementer */}
      <Stack spacing={2}>
        {overskrifter.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography color="text.secondary">
              Ingen plan-elementer ennå. Legg til en overskrift for å komme i gang.
            </Typography>
          </Paper>
        ) : (
          overskrifter.map((overskrift) => {
            const hendelser = getHendelserForOverskrift(overskrift.id);
            const isExpanded = expandedHeaders.has(overskrift.id);

            return (
              <Paper key={overskrift.id} sx={{ overflow: 'hidden' }}>
                {/* Overskrift */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleHeader(overskrift.id)}
                >
                  <IconButton size="small" sx={{ color: 'white' }}>
                    {isExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                  <DragIndicator sx={{ opacity: 0.7 }} />
                  <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {overskrift.navn}
                  </Typography>
                  <Chip 
                    label={`${hendelser.length} ${hendelser.length === 1 ? 'hendelse' : 'hendelser'}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(overskrift);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(overskrift.id);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>

                {/* Hendelser under overskrift */}
                <Collapse in={isExpanded}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {hendelser.length === 0 ? (
                      <Typography color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                        Ingen hendelser ennå
                      </Typography>
                    ) : (
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        {hendelser.map((hendelse) => (
                          <Paper
                            key={hendelse.id}
                            sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <DragIndicator sx={{ color: 'text.secondary' }} />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body1">
                                {hendelse.navn}
                              </Typography>
                            </Box>
                            <Chip
                              icon={<Schedule />}
                              label={formatVarighet(hendelse.varighet_minutter!)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(hendelse)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(hendelse.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => openHendelseDialog(overskrift.id)}
                      size="small"
                    >
                      Legg til hendelse
                    </Button>
                  </Box>
                </Collapse>
              </Paper>
            );
          })
        )}
      </Stack>

      {/* Dialog for legg til/rediger */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingElement ? 'Rediger' : 'Legg til'} {dialogMode === 'overskrift' ? 'overskrift' : 'hendelse'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Navn"
              value={navn}
              onChange={(e) => setNavn(e.target.value)}
              fullWidth
              autoFocus
              required
            />
            {dialogMode === 'hendelse' && (
              <TextField
                label="Varighet"
                type="number"
                value={varighet}
                onChange={(e) => setVarighetValue(parseInt(e.target.value) || 0)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutter</InputAdornment>,
                }}
                fullWidth
                required
                inputProps={{ min: 0 }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Avbryt</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingElement ? 'Oppdater' : 'Legg til'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlanMalEditor;


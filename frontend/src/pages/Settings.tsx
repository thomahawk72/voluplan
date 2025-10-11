import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Collapse,
} from '@mui/material';
import {
  ArrowBack,
  Settings as SettingsIcon,
  Category,
  People,
  TheaterComedy,
  Add,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  FolderOpen,
  Folder,
} from '@mui/icons-material';
import { talentAPI, TalentKategori, Talent } from '../services/api';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [kategorier, setKategorier] = useState<TalentKategori[]>([]);
  const [talenter, setTalenter] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apneKategorier, setApneKategorier] = useState<Set<number>>(new Set());
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'kategori' | 'talent'>('kategori');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<TalentKategori | Talent | null>(null);
  
  // Form state
  const [formNavn, setFormNavn] = useState('');
  const [formParentId, setFormParentId] = useState<number | ''>('');
  const [formKategoriId, setFormKategoriId] = useState<number | ''>('');
  const [formBeskrivelse, setFormBeskrivelse] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [kategoriData, talentData] = await Promise.all([
        talentAPI.getAllKategorier(),
        talentAPI.getAll(),
      ]);
      
      setKategorier(kategoriData.kategorier || []);
      setTalenter(talentData.kompetanser || []);
    } catch (err: any) {
      console.error('Feil ved lasting av data:', err);
      setError('Kunne ikke laste data. Vennligst prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const toggleKategori = (kategoriId: number) => {
    setApneKategorier(prev => {
      const nySet = new Set(prev);
      if (nySet.has(kategoriId)) {
        nySet.delete(kategoriId);
      } else {
        nySet.add(kategoriId);
      }
      return nySet;
    });
  };

  const openCreateKategoriDialog = (parentId?: number) => {
    setDialogType('kategori');
    setDialogMode('create');
    setSelectedItem(null);
    setFormNavn('');
    setFormParentId(parentId || '');
    setFormBeskrivelse('');
    setOpenDialog(true);
  };

  const openEditKategoriDialog = (kategori: TalentKategori) => {
    setDialogType('kategori');
    setDialogMode('edit');
    setSelectedItem(kategori);
    setFormNavn(kategori.navn);
    setFormParentId(kategori.parent_id || '');
    setFormBeskrivelse(kategori.beskrivelse || '');
    setOpenDialog(true);
  };

  const openCreateTalentDialog = (kategoriId: number) => {
    setDialogType('talent');
    setDialogMode('create');
    setSelectedItem(null);
    setFormNavn('');
    setFormKategoriId(kategoriId);
    setFormBeskrivelse('');
    setOpenDialog(true);
  };

  const openEditTalentDialog = (talent: Talent) => {
    setDialogType('talent');
    setDialogMode('edit');
    setSelectedItem(talent);
    setFormNavn(talent.navn);
    setFormKategoriId(talent.kategori_id);
    setFormBeskrivelse(talent.beskrivelse || '');
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (dialogType === 'kategori') {
        if (dialogMode === 'create') {
          await talentAPI.createKategori({
            navn: formNavn,
            parentId: formParentId || undefined,
            beskrivelse: formBeskrivelse || undefined,
          });
        } else if (selectedItem) {
          await talentAPI.updateKategori(selectedItem.id, {
            navn: formNavn,
            parentId: formParentId || undefined,
            beskrivelse: formBeskrivelse || undefined,
          });
        }
      } else {
        if (dialogMode === 'create') {
          await talentAPI.create({
            navn: formNavn,
            kategoriId: formKategoriId as number,
            beskrivelse: formBeskrivelse || undefined,
          });
        } else if (selectedItem) {
          await talentAPI.update(selectedItem.id, {
            navn: formNavn,
            kategoriId: formKategoriId as number,
            beskrivelse: formBeskrivelse || undefined,
          });
        }
      }
      
      setOpenDialog(false);
      fetchData();
    } catch (err: any) {
      console.error('Feil ved lagring:', err);
      setError(err.response?.data?.error || 'Kunne ikke lagre. Vennligst prøv igjen.');
    }
  };

  const handleDelete = async (type: 'kategori' | 'talent', id: number, navn: string) => {
    if (!window.confirm(`Er du sikker på at du vil slette "${navn}"?`)) {
      return;
    }
    
    try {
      setError(null);
      if (type === 'kategori') {
        await talentAPI.deleteKategori(id);
      } else {
        await talentAPI.delete(id);
      }
      fetchData();
    } catch (err: any) {
      console.error('Feil ved sletting:', err);
      const errorMsg = err.response?.data?.error || 'Kunne ikke slette. Vennligst prøv igjen.';
      setError(errorMsg);
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Bygg hierarkisk struktur
  const rootKategorier = kategorier.filter(k => !k.parent_id);
  const getChildren = (parentId: number) => kategorier.filter(k => k.parent_id === parentId);
  const getTalenterForKategori = (kategoriId: number) => talenter.filter(t => t.kategori_id === kategoriId);

  // Finn nivå 3 kategorier (de som kan ha talenter)
  const detailKategorier = kategorier.filter(k => {
    const parent = kategorier.find(p => p.id === k.parent_id);
    return parent?.parent_id !== null && parent?.parent_id !== undefined;
  });

  const renderTalentTree = () => {
    return rootKategorier.map(root => (
      <Box key={root.id} sx={{ mb: 2 }}>
        {/* Root Kategori */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
          onClick={() => toggleKategori(root.id)}
        >
          <IconButton size="small" sx={{ color: 'white' }}>
            {apneKategorier.has(root.id) ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          <Folder />
          <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
            {root.navn}
          </Typography>
          <Chip 
            label={getChildren(root.id).length + ' sub'} 
            size="small" 
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          />
          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); openEditKategoriDialog(root); }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleDelete('kategori', root.id, root.navn); }}>
            <Delete fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); openCreateKategoriDialog(root.id); }}>
            <Add fontSize="small" />
          </IconButton>
        </Box>

        {/* Sub-kategorier */}
        <Collapse in={apneKategorier.has(root.id)}>
          <Box sx={{ pl: 4, mt: 1 }}>
            {getChildren(root.id).map(sub => (
              <Box key={sub.id} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'secondary.dark' }
                  }}
                  onClick={() => toggleKategori(sub.id)}
                >
                  <IconButton size="small" sx={{ color: 'white' }}>
                    {apneKategorier.has(sub.id) ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                  <FolderOpen fontSize="small" />
                  <Typography sx={{ fontWeight: 500, flexGrow: 1 }}>
                    {sub.navn}
                  </Typography>
                  <Chip 
                    label={getChildren(sub.id).length + ' detail'} 
                    size="small" 
                    sx={{ bgcolor: 'white', color: 'secondary.main' }}
                  />
                  <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); openEditKategoriDialog(sub); }}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleDelete('kategori', sub.id, sub.navn); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); openCreateKategoriDialog(sub.id); }}>
                    <Add fontSize="small" />
                  </IconButton>
                </Box>

                {/* Detail-kategorier */}
                <Collapse in={apneKategorier.has(sub.id)}>
                  <Box sx={{ pl: 4, mt: 1 }}>
                    {getChildren(sub.id).map(detail => {
                      const talenterIKategori = getTalenterForKategori(detail.id);
                      return (
                        <Box key={detail.id} sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: 1.5,
                              bgcolor: 'info.light',
                              color: 'white',
                              borderRadius: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'info.main' }
                            }}
                            onClick={() => toggleKategori(detail.id)}
                          >
                            <IconButton size="small" sx={{ color: 'white' }}>
                              {apneKategorier.has(detail.id) ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                            <Category fontSize="small" />
                            <Typography sx={{ fontWeight: 500, flexGrow: 1 }}>
                              {detail.navn}
                            </Typography>
                            <Chip 
                              label={talenterIKategori.length + ' talenter'} 
                              size="small" 
                              sx={{ bgcolor: 'white', color: 'info.main' }}
                            />
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); openEditKategoriDialog(detail); }}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleDelete('kategori', detail.id, detail.navn); }}>
                              <Delete fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); openCreateTalentDialog(detail.id); }}>
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Talenter */}
                          <Collapse in={apneKategorier.has(detail.id)}>
                            <Box sx={{ pl: 4, mt: 1 }}>
                              {talenterIKategori.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 1 }}>
                                  Ingen talenter ennå
                                </Alert>
                              ) : (
                                talenterIKategori.map(talent => (
                                  <Box
                                    key={talent.id}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      p: 1,
                                      bgcolor: 'grey.100',
                                      borderRadius: 1,
                                      mb: 0.5,
                                      '&:hover': { bgcolor: 'grey.200' }
                                    }}
                                  >
                                    <Typography sx={{ flexGrow: 1, fontSize: '0.9rem' }}>
                                      {talent.navn}
                                    </Typography>
                                    {talent.beskrivelse && (
                                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {talent.beskrivelse}
                                      </Typography>
                                    )}
                                    <IconButton size="small" onClick={() => openEditTalentDialog(talent)}>
                                      <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDelete('talent', talent.id, talent.navn)}>
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ))
                              )}
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => openCreateKategoriDialog(sub.id)}
                      sx={{ mt: 1, ml: 4 }}
                    >
                      Ny detail-kategori
                    </Button>
                  </Box>
                </Collapse>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => openCreateKategoriDialog(root.id)}
              sx={{ mt: 1, ml: 4 }}
            >
              Ny sub-kategori
            </Button>
          </Box>
        </Collapse>
      </Box>
    ));
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <SettingsIcon sx={{ ml: 2, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Innstillinger
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Oversikt Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
          {/* Talent Card */}
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Category color="primary" />
                <Typography variant="h6">Talent & Kategorier</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Administrer talenter og deres hierarkiske kategorier (3 nivåer)
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled>Aktiv</Button>
            </CardActions>
          </Card>

          {/* Produksjonskategori Card */}
          <Card sx={{ boxShadow: 3, opacity: 0.6 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TheaterComedy color="action" />
                <Typography variant="h6">Produksjonskategorier</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Administrer kategorier for produksjoner
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled>Kommer snart</Button>
            </CardActions>
          </Card>

          {/* Brukere Card */}
          <Card sx={{ boxShadow: 3, opacity: 0.6 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <People color="action" />
                <Typography variant="h6">Brukere</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Administrer brukere og deres roller
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled>Kommer snart</Button>
            </CardActions>
          </Card>
        </Box>

        {/* Talent Hierarki */}
        <Paper sx={{ p: 3, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Talent Hierarki
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCreateKategoriDialog()}
            >
              Ny root-kategori
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {renderTalentTree()}
            </Box>
          )}
        </Paper>
      </Container>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Opprett' : 'Rediger'} {dialogType === 'kategori' ? 'Kategori' : 'Talent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Navn"
              value={formNavn}
              onChange={(e) => setFormNavn(e.target.value)}
              fullWidth
              required
            />
            
            {dialogType === 'kategori' && (
              <TextField
                label="Overordnet kategori"
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value ? parseInt(e.target.value) : '')}
                select
                fullWidth
              >
                <MenuItem value="">Ingen (root-kategori)</MenuItem>
                {kategorier.map(k => (
                  <MenuItem key={k.id} value={k.id}>
                    {k.path || k.navn}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {dialogType === 'talent' && (
              <TextField
                label="Kategori"
                value={formKategoriId}
                onChange={(e) => setFormKategoriId(parseInt(e.target.value))}
                select
                fullWidth
                required
              >
                {detailKategorier.map(k => (
                  <MenuItem key={k.id} value={k.id}>
                    {k.path || k.navn}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Beskrivelse"
              value={formBeskrivelse}
              onChange={(e) => setFormBeskrivelse(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Avbryt</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formNavn || (dialogType === 'talent' && !formKategoriId)}>
            Lagre
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;


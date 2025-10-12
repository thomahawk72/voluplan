import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from '@mui/material';
import {
  ArrowBack,
  Settings as SettingsIcon,
  Category,
  People,
  TheaterComedy,
  Add,
} from '@mui/icons-material';
import { TalentKategori, Talent } from '../services/api';
import { useTalentData } from '../hooks/useTalentData';
import TalentTree from '../components/settings/TalentTree';
import TalentDialog from '../components/settings/TalentDialog';
import UserManagement from '../components/settings/UserManagement';
import ConfirmDeleteTalentDialog from '../components/settings/ConfirmDeleteTalentDialog';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    kategorier,
    talenter,
    loading,
    error,
    setError,
    createKategori,
    updateKategori,
    deleteKategori,
    createTalent,
    updateTalent,
    deleteTalent,
    getRootKategorier,
    getChildren,
    getTalenterForKategori,
    kategoriSomKanHaTalenter,
  } = useTalentData();
  
  const [apneKategorier, setApneKategorier] = useState<Set<number>>(new Set());
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'kategori' | 'talent'>('kategori');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<TalentKategori | Talent | null>(null);
  const [initialParentId, setInitialParentId] = useState<number | undefined>();
  const [initialKategoriId, setInitialKategoriId] = useState<number | undefined>();
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'talent' | 'kategori'>('talent');
  const [itemToDelete, setItemToDelete] = useState<{ id: number; navn: string; kategoriNavn?: string; childCount?: number } | null>(null);
  
  // Les activeTab fra URL, default til 'talent'
  const getInitialTab = (): 'talent' | 'produksjon' | 'brukere' => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'brukere' || tabFromUrl === 'produksjon' || tabFromUrl === 'talent') {
      return tabFromUrl;
    }
    return 'talent';
  };

  const [activeTab, setActiveTab] = useState<'talent' | 'produksjon' | 'brukere'>(getInitialTab);

  // Oppdater URL når tab endres
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Synkroniser med URL ved endringer (f.eks. browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      if (tabFromUrl === 'brukere' || tabFromUrl === 'produksjon' || tabFromUrl === 'talent') {
        setActiveTab(tabFromUrl);
      }
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setInitialParentId(parentId);
    setOpenDialog(true);
  };

  const openEditKategoriDialog = (kategori: TalentKategori) => {
    setDialogType('kategori');
    setDialogMode('edit');
    setSelectedItem(kategori);
    setOpenDialog(true);
  };

  const openCreateTalentDialog = (kategoriId: number) => {
    setDialogType('talent');
    setDialogMode('create');
    setSelectedItem(null);
    setInitialKategoriId(kategoriId);
    setOpenDialog(true);
  };

  const openEditTalentDialog = (talent: Talent) => {
    setDialogType('talent');
    setDialogMode('edit');
    setSelectedItem(talent);
    setOpenDialog(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (dialogType === 'kategori') {
        if (dialogMode === 'create') {
          await createKategori(data);
        } else if (selectedItem) {
          await updateKategori(selectedItem.id, data);
        }
      } else {
        if (dialogMode === 'create') {
          await createTalent(data);
        } else if (selectedItem) {
          await updateTalent(selectedItem.id, data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunne ikke lagre. Vennligst prøv igjen.');
      throw err;
    }
  };

  const handleDeleteKategoriClick = (id: number, navn: string) => {
    // Tell antall children (sub-kategorier + talents i denne kategorien)
    const children = getChildren(id);
    const talents = getTalenterForKategori(id);
    const childCount = children.length + talents.length;
    
    setDeleteType('kategori');
    setItemToDelete({ id, navn, childCount });
    setDeleteDialogOpen(true);
  };

  const handleDeleteTalentClick = (id: number, navn: string, kategoriNavn?: string) => {
    setDeleteType('talent');
    setItemToDelete({ id, navn, kategoriNavn });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      setError(null);
      setDeleteDialogOpen(false);
      
      if (deleteType === 'kategori') {
        await deleteKategori(itemToDelete.id);
      } else {
        await deleteTalent(itemToDelete.id);
      }
      
      setItemToDelete(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Kunne ikke slette. Vennligst prøv igjen.';
      setError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
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
          <Card 
            sx={{ 
              boxShadow: 3, 
              cursor: 'pointer',
              border: activeTab === 'talent' ? 2 : 0,
              borderColor: 'primary.main',
              '&:hover': { boxShadow: 6 }
            }}
            onClick={() => setActiveTab('talent')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Category color={activeTab === 'talent' ? 'primary' : 'action'} />
                <Typography variant="h6">Talent & Kategorier</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Administrer talenter og deres hierarkiske kategorier
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled={activeTab === 'talent'}>
                {activeTab === 'talent' ? 'Aktiv' : 'Vis'}
              </Button>
            </CardActions>
          </Card>

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

          <Card 
            sx={{ 
              boxShadow: 3,
              cursor: 'pointer',
              border: activeTab === 'brukere' ? 2 : 0,
              borderColor: 'primary.main',
              '&:hover': { boxShadow: 6 }
            }}
            onClick={() => setActiveTab('brukere')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <People color={activeTab === 'brukere' ? 'primary' : 'action'} />
                <Typography variant="h6">Brukere</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Administrer brukere og deres roller
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled={activeTab === 'brukere'}>
                {activeTab === 'brukere' ? 'Aktiv' : 'Vis'}
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* Talenthierarki */}
        {activeTab === 'talent' && (
          <Paper sx={{ p: 3, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Talenthierarki
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
              <TalentTree
                kategorier={kategorier}
                talenter={talenter}
                apneKategorier={apneKategorier}
                onToggle={toggleKategori}
                onEditKategori={openEditKategoriDialog}
                onDeleteKategori={handleDeleteKategoriClick}
                onCreateSubKategori={openCreateKategoriDialog}
                onCreateTalent={openCreateTalentDialog}
                onEditTalent={openEditTalentDialog}
                onDeleteTalent={handleDeleteTalentClick}
                getChildren={getChildren}
                getTalenterForKategori={getTalenterForKategori}
              />
            )}
          </Paper>
        )}

        {/* Bruker Administrasjon */}
        {activeTab === 'brukere' && (
          <Paper sx={{ p: 3, boxShadow: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Brukeradministrasjon
            </Typography>
            <UserManagement />
          </Paper>
        )}
      </Container>

      {/* Create/Edit Dialog */}
      <TalentDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
        type={dialogType}
        mode={dialogMode}
        item={selectedItem}
        kategorier={kategorier}
        kategoriSomKanHaTalenter={kategoriSomKanHaTalenter}
        initialParentId={initialParentId}
        initialKategoriId={initialKategoriId}
      />

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <ConfirmDeleteTalentDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          type={deleteType}
          itemName={itemToDelete.navn}
          kategoriNavn={itemToDelete.kategoriNavn}
          childCount={itemToDelete.childCount}
        />
      )}
    </Box>
  );
};

export default Settings;

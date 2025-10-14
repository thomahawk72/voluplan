import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material';
import { produksjonAPI } from '../../services/api';
import TalentMalEditor from './TalentMalEditor';
import ConfirmDialog from '../common/ConfirmDialog';

interface ProduksjonsKategori {
  id: number;
  navn: string;
  beskrivelse: string | null;
  plassering?: string | null;
}

const ProduksjonsKategoriMal: React.FC = () => {
  const [kategorier, setKategorier] = useState<ProduksjonsKategori[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Høyrepanel felter
  const [navn, setNavn] = useState('');
  const [beskrivelse, setBeskrivelse] = useState('');
  const [plassering, setPlassering] = useState('');
  const [activeTab, setActiveTab] = useState<'talenter' | 'oppmote'>('talenter');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const kategoriData = await produksjonAPI.getAllKategorier();
      setKategorier(kategoriData.kategorier);
    } catch (err: any) {
      setError('Kunne ikke laste data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKategoriClick = (id: number) => {
    // Toggle: klikk på samme kategori lukker høyrepanelet
    setSelectedKategori(prev => (prev === id ? null : id));
    setActiveTab('talenter');

    // Prefill felter fra valgt kategori
    const k = kategorier.find(k => k.id === id);
    if (k) {
      setNavn(k.navn || '');
      setBeskrivelse(k.beskrivelse || '');
      setPlassering(k.plassering || '');
      setSaved(null);
      setError(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(null)}>
          {saved}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3 }}>
        {/* Venstre: Produksjonskategorier */}
        <Paper sx={{ p: 2, height: 'fit-content', position: 'sticky', top: 16 }}>
          <List>
            {kategorier.map((kategori) => (
              <ListItemButton
                key={kategori.id}
                selected={selectedKategori === kategori.id}
                onClick={() => handleKategoriClick(kategori.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }
                }}
              >
                <ListItemText 
                  primary={kategori.navn}
                  secondary={kategori.beskrivelse}
                  secondaryTypographyProps={{
                    sx: { color: selectedKategori === kategori.id ? 'rgba(255,255,255,0.7)' : 'text.secondary' }
                  }}
                />
                {selectedKategori === kategori.id ? <ExpandMore /> : <ChevronRight />}
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* Høyre: Kategori-detaljer + faner */}
        <Paper sx={{ p: 3 }}>
          {selectedKategori ? (
            <>
              {/* Kategori header-felter */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                  gap: 2,
                  mb: 2,
                  alignItems: 'center',
                }}
              >
                <TextField
                  label="Navn"
                  value={navn}
                  onChange={(e) => setNavn(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Beskrivelse"
                  value={beskrivelse}
                  onChange={(e) => setBeskrivelse(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Plassering"
                  placeholder="F.eks. Scene, Backstage"
                  value={plassering}
                  onChange={(e) => setPlassering(e.target.value)}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => setConfirmOpen(true)}
                >
                  Slett kategori
                </Button>
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (!selectedKategori) return;
                    try {
                      setError(null);
                      setSaved(null);
                      await produksjonAPI.updateKategori(selectedKategori, { navn, beskrivelse, plassering });
                      // Refetch og hold valg
                      const data = await produksjonAPI.getAllKategorier();
                      setKategorier(data.kategorier);
                      const k = data.kategorier.find((x: any) => x.id === selectedKategori);
                      if (k) {
                        setNavn(k.navn || '');
                        setBeskrivelse(k.beskrivelse || '');
                        setPlassering(k.plassering || '');
                      }
                      setSaved('Kategori lagret');
                    } catch (e: any) {
                      console.error(e);
                      setError(e?.response?.data?.error || 'Kunne ikke lagre kategori');
                    }
                  }}
                >
                  Lagre detaljer
                </Button>
              </Box>

              <ConfirmDialog
                open={confirmOpen}
                title="Slett kategori"
                message={`Slette produksjonskategori "${navn}"? Dette kan ikke angres.`}
                confirmText="Slett"
                cancelText="Avbryt"
                destructive
                onCancel={() => setConfirmOpen(false)}
                onConfirm={async () => {
                  if (!selectedKategori) return;
                  try {
                    setError(null);
                    setSaved(null);
                    await produksjonAPI.deleteKategori(selectedKategori);
                    const data = await produksjonAPI.getAllKategorier();
                    setKategorier(data.kategorier);
                    setSelectedKategori(null);
                    setNavn('');
                    setBeskrivelse('');
                    setPlassering('');
                    setSaved('Kategori slettet');
                  } catch (e: any) {
                    setError(e?.response?.data?.error || 'Kunne ikke slette kategori');
                  } finally {
                    setConfirmOpen(false);
                  }
                }}
              />

              {/* Faner */}
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 2 }}
              >
                <Tab value="talenter" label="Talenter" />
                <Tab value="oppmote" label="Oppmøtetider" />
              </Tabs>

              {activeTab === 'talenter' && (
                <TalentMalEditor
                  kategoriId={selectedKategori}
                  kategoriNavn={navn}
                  onSave={() => {}}
                />
              )}

              {activeTab === 'oppmote' && (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                    Oppmøtetider (kommer snart)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Her kan du etterhvert definere standard oppmøtetider for denne produksjonskategorien.
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Alert severity="info">
              Velg en produksjonskategori fra listen til venstre for å konfigurere detaljer
            </Alert>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ProduksjonsKategoriMal;


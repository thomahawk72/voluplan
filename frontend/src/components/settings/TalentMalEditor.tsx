import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save,
} from '@mui/icons-material';
import { produksjonAPI, talentAPI, ProduksjonsKategoriTalentMal, Talent, TalentKategori } from '../../services/api';
import SelectableTalentTree from './SelectableTalentTree';
import { TalentSelection } from './SelectableTalentList';

interface Props {
  kategoriId: number;
  kategoriNavn: string;
  onSave: () => void;
}

const TalentMalEditor: React.FC<Props> = ({ kategoriId, kategoriNavn, onSave }) => {
  const [kategorier, setKategorier] = useState<TalentKategori[]>([]);
  const [selectionsByKategori, setSelectionsByKategori] = useState<Map<number, TalentSelection[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apneKategorier, setApneKategorier] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategoriId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kategoriData, talentData, talentMalData] = await Promise.all([
        talentAPI.getAllKategorier(),
        talentAPI.getAll(),
        produksjonAPI.getTalentMal(kategoriId),
      ]);

      setKategorier(kategoriData.kategorier);

      // Grupper talenter etter talent-kategori ID
      const selMap = new Map<number, TalentSelection[]>();
      
      talentData.kompetanser.forEach((talent: Talent) => {
        if (!selMap.has(talent.kategori_id)) {
          selMap.set(talent.kategori_id, []);
        }

        // Finn om dette talentet allerede er i malen
        const existingMal = talentMalData.talentMal.find((m: ProduksjonsKategoriTalentMal) => m.talent_id === talent.id);

        selMap.get(talent.kategori_id)!.push({
          talent,
          selected: !!existingMal,
          antall: existingMal?.antall || 1,
          beskrivelse: existingMal?.beskrivelse || '',
        });
      });

      // Sorter talenter innenfor hver kategori
      selMap.forEach((selections) => {
        selections.sort((a, b) => a.talent.navn.localeCompare(b.talent.navn));
      });

      setSelectionsByKategori(selMap);

      // Start alltid kollapset ved valg/refresh av kategori
      setApneKategorier(new Set<number>());

    } catch (err: any) {
      setError('Kunne ikke laste talenter');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKategori = (kategoriId: number) => {
    setApneKategorier(prev => {
      const next = new Set(prev);
      if (next.has(kategoriId)) {
        next.delete(kategoriId);
      } else {
        next.add(kategoriId);
      }
      return next;
    });
  };

  const handleTalentToggle = (kategoriId: number, index: number) => {
    setSelectionsByKategori(prev => {
      const next = new Map(prev);
      const selections = [...(next.get(kategoriId) || [])];
      const selection = { ...selections[index] };
      selection.selected = !selection.selected;
      if (selection.selected && selection.antall === 0) {
        selection.antall = 1;
      }
      selections[index] = selection;
      next.set(kategoriId, selections);
      return next;
    });
  };

  const handleAntallChange = (kategoriId: number, index: number, antall: number) => {
    setSelectionsByKategori(prev => {
      const next = new Map(prev);
      const selections = [...(next.get(kategoriId) || [])];
      const selection = { ...selections[index] };
      selection.antall = Math.max(1, antall);
      selection.selected = true;
      selections[index] = selection;
      next.set(kategoriId, selections);
      return next;
    });
  };

  const handleBeskrivelseChange = (kategoriId: number, index: number, beskrivelse: string) => {
    setSelectionsByKategori(prev => {
      const next = new Map(prev);
      const selections = [...(next.get(kategoriId) || [])];
      const selection = { ...selections[index] };
      selection.beskrivelse = beskrivelse;
      selections[index] = selection;
      next.set(kategoriId, selections);
      return next;
    });
  };

  const handleClearKategori = (kategoriId: number) => {
    setSelectionsByKategori(prev => {
      const next = new Map(prev);
      const selections = (next.get(kategoriId) || []).map(s => ({ ...s, selected: false }));
      next.set(kategoriId, selections);
      return next;
    });
  };

  const getChildren = (parentId: number): TalentKategori[] => {
    return kategorier.filter(k => k.parent_id === parentId);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Hent eksisterende mal
      const talentMalData = await produksjonAPI.getTalentMal(kategoriId);
      const existingMal = talentMalData.talentMal;

      // Samle alle selections
      const allSelections: TalentSelection[] = [];
      selectionsByKategori.forEach((selections) => {
        allSelections.push(...selections);
      });

      const selectedTalenter = allSelections.filter(s => s.selected);

      // Finn talenter som skal fjernes
      for (const mal of existingMal) {
        const stillSelected = selectedTalenter.find(s => s.talent.id === mal.talent_id);
        if (!stillSelected) {
          await produksjonAPI.removeTalentFromMal(kategoriId, mal.id);
        }
      }

      // Legg til eller oppdater valgte talenter
      for (const selection of selectedTalenter) {
        const existingEntry = existingMal.find(m => m.talent_id === selection.talent.id);
        
        if (existingEntry) {
          // Oppdater eksisterende
          await produksjonAPI.updateTalentInMal(kategoriId, existingEntry.id, {
            antall: selection.antall,
            beskrivelse: selection.beskrivelse || undefined,
          });
        } else {
          // Legg til ny
          await produksjonAPI.addTalentToMal(kategoriId, {
            talentId: selection.talent.id,
            antall: selection.antall,
            beskrivelse: selection.beskrivelse || undefined,
          });
        }
      }

      onSave();
      await fetchData(); // Refresh for å få oppdaterte data

    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunne ikke lagre');
    } finally {
      setSaving(false);
    }
  };

  const getTotalSelected = () => {
    let total = 0;
    selectionsByKategori.forEach((selections) => {
      total += selections.filter(s => s.selected).length;
    });
    return total;
  };

  const getTotalAntall = () => {
    let total = 0;
    selectionsByKategori.forEach((selections) => {
      total += selections.filter(s => s.selected).reduce((sum, s) => sum + s.antall, 0);
    });
    return total;
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header med statistikk */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: 'primary.light',
        borderRadius: 1,
      }}>
        <Box>
          <Typography variant="h6" sx={{ color: 'primary.contrastText', fontWeight: 600 }}>
            {kategoriNavn}
          </Typography>
          <Typography variant="body2" sx={{ color: 'primary.contrastText', opacity: 0.9 }}>
            {getTotalSelected()} talenter valgt • {getTotalAntall()} personer totalt
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
          sx={{ 
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          {saving ? 'Lagrer...' : 'Lagre mal'}
        </Button>
      </Box>

      {/* Talent-tree med valgmuligheter */}
      <SelectableTalentTree
        kategorier={kategorier}
        selectionsByKategori={selectionsByKategori}
        apneKategorier={apneKategorier}
        onToggle={handleToggleKategori}
        onTalentToggle={handleTalentToggle}
        onAntallChange={handleAntallChange}
        onBeskrivelseChange={handleBeskrivelseChange}
        onClearKategori={handleClearKategori}
        getChildren={getChildren}
      />

      {/* Footer med lagre-knapp */}
      <Box sx={{ 
        position: 'sticky', 
        bottom: 0, 
        bgcolor: 'background.paper', 
        p: 2, 
        mt: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Typography variant="body2" color="text.secondary">
          {getTotalSelected()} talenter • {getTotalAntall()} personer totalt
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Lagrer...' : 'Lagre mal'}
        </Button>
      </Box>
    </Box>
  );
};

export default TalentMalEditor;


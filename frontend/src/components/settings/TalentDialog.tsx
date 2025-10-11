import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Box,
} from '@mui/material';
import { TalentKategori, Talent } from '../../services/api';

interface TalentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  type: 'kategori' | 'talent';
  mode: 'create' | 'edit';
  item: TalentKategori | Talent | null;
  kategorier: TalentKategori[];
  kategoriSomKanHaTalenter: TalentKategori[];
  initialParentId?: number;
  initialKategoriId?: number;
}

const TalentDialog: React.FC<TalentDialogProps> = ({
  open,
  onClose,
  onSave,
  type,
  mode,
  item,
  kategorier,
  kategoriSomKanHaTalenter,
  initialParentId,
  initialKategoriId,
}) => {
  const [formNavn, setFormNavn] = useState('');
  const [formParentId, setFormParentId] = useState<number | ''>('');
  const [formKategoriId, setFormKategoriId] = useState<number | ''>('');
  const [formBeskrivelse, setFormBeskrivelse] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setFormNavn(item.navn);
        setFormBeskrivelse(item.beskrivelse || '');
        if (type === 'kategori') {
          setFormParentId((item as TalentKategori).parent_id || '');
        } else {
          setFormKategoriId((item as Talent).kategori_id);
        }
      } else {
        setFormNavn('');
        setFormBeskrivelse('');
        setFormParentId(initialParentId || '');
        setFormKategoriId(initialKategoriId || '');
      }
    }
  }, [open, item, type, initialParentId, initialKategoriId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const data: any = {
        navn: formNavn,
        beskrivelse: formBeskrivelse || undefined,
      };

      if (type === 'kategori') {
        data.parentId = formParentId || undefined;
      } else {
        data.kategoriId = formKategoriId;
      }

      await onSave(data);
      onClose();
    } catch (err) {
      console.error('Feil ved lagring:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Opprett' : 'Rediger'} {type === 'kategori' ? 'Kategori' : 'Talent'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Navn"
            value={formNavn}
            onChange={(e) => setFormNavn(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          
          {type === 'kategori' && (
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

          {type === 'talent' && (
            <TextField
              label="Kategori"
              value={formKategoriId}
              onChange={(e) => setFormKategoriId(parseInt(e.target.value))}
              select
              fullWidth
              required
              helperText="Velg en kategori som ikke har sub-kategorier"
            >
              {kategoriSomKanHaTalenter.map(k => (
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
        <Button onClick={onClose} disabled={saving}>
          Avbryt
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!formNavn || (type === 'talent' && !formKategoriId) || saving}
        >
          {saving ? 'Lagrer...' : 'Lagre'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TalentDialog;


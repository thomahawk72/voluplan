import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface ConfirmDeleteTalentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'talent' | 'kategori';
  itemName: string;
  kategoriNavn?: string;
  childCount?: number;
}

const ConfirmDeleteTalentDialog: React.FC<ConfirmDeleteTalentDialogProps> = ({
  open,
  onClose,
  onConfirm,
  type,
  itemName,
  kategoriNavn,
  childCount = 0,
}) => {
  const isTalent = type === 'talent';
  const hasChildren = childCount > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderTop: 4,
          borderColor: 'error.main',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 2 }}>
        <Warning color="error" />
        <Typography variant="h6" component="span">
          Slett {isTalent ? 'talent' : 'kategori'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Er du sikker på at du vil slette
        </Typography>
        <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {itemName}
          </Typography>
          {kategoriNavn && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {kategoriNavn}
            </Typography>
          )}
          {hasChildren && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
              inkludert {childCount} sub-element{childCount > 1 ? 'er' : ''}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="error">
          Denne handlingen kan ikke angres.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Avbryt
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
        >
          Slett
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteTalentDialog;


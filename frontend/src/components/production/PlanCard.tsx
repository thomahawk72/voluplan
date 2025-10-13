import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { Schedule } from '@mui/icons-material';
import { ProduksjonsPlan, Produksjon, produksjonAPI } from '../../services/api';

interface PlanCardProps {
  visible: boolean;
  plan: ProduksjonsPlan | null;
  produksjon: Produksjon;
}

const PlanCard: React.FC<PlanCardProps> = ({ visible, plan, produksjon }) => {
  const [plassering, setPlassering] = useState<string>(produksjon.plassering || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!visible) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      await produksjonAPI.updateProduksjon(produksjon.id, { plassering });
      setSaved(true);
    } catch (e: any) {
      setError('Kunne ikke lagre plassering');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Schedule color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Produksjonsplan
            </Typography>
          </Box>

          {!plan ? (
            <Alert severity="info">Ingen plan er knyttet til denne produksjonen</Alert>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {plan.navn}
              </Typography>
              {plan.beskrivelse && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.beskrivelse}
                </Typography>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Starttid</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(produksjon.tid).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                {plan.start_dato && plan.slutt_dato && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Varighet</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {Math.ceil((new Date(plan.slutt_dato).getTime() - new Date(plan.start_dato).getTime()) / (1000 * 60 * 60 * 24))} dager
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 4, mb: 2 }}>
            Plan og plassering
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
            <TextField
              label="Plassering"
              placeholder="F.eks. Hovedscene, Backstage"
              value={plassering}
              onChange={(e) => setPlassering(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Lagrer...' : 'Lagre'}
            </Button>
          </Box>

          {saved && <Alert sx={{ mt: 2 }} severity="success">Lagret</Alert>}
          {error && <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlanCard;


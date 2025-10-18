import React from 'react';
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { Schedule } from '@mui/icons-material';
import { ProduksjonsPlan, Produksjon } from '../../services/api';

interface PlanCardProps {
  visible: boolean;
  plan: ProduksjonsPlan | null;
  produksjon: Produksjon;
}

const PlanCard: React.FC<PlanCardProps> = ({ visible, plan, produksjon }) => {
  if (!visible) return null;

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
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlanCard;


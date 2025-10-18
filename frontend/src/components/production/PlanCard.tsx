import React from 'react';
import { Box, Card, CardContent, Typography, Alert, Divider, Chip } from '@mui/material';
import { Schedule, AccessTime } from '@mui/icons-material';
import { ProduksjonsPlan, Produksjon, PlanElement } from '../../services/api';

interface PlanCardProps {
  visible: boolean;
  plan: ProduksjonsPlan | null;
  planElementer: PlanElement[];
  produksjon: Produksjon;
}

const PlanCard: React.FC<PlanCardProps> = ({ visible, plan, planElementer, produksjon }) => {
  if (!visible) return null;

  // Grupper hendelser under overskrifter
  const overskrifter = planElementer.filter(el => el.type === 'overskrift');
  
  return (
    <Box sx={{ mb: 3 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Schedule color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Plan for {produksjon.navn}
            </Typography>
          </Box>

          {planElementer.length === 0 ? (
            <Alert severity="info">
              Ingen plan-elementer er lagt til for denne produksjonen.
              {plan && ` (Del av ${plan.navn})`}
            </Alert>
          ) : (
            <Box>
              {overskrifter.map((overskrift) => {
                const hendelser = planElementer.filter(el => 
                  el.type === 'hendelse' && el.parent_id === overskrift.id
                );
                
                return (
                  <Box key={overskrift.id} sx={{ mb: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 1.5,
                        color: 'primary.main',
                        borderBottom: '2px solid',
                        borderColor: 'primary.main',
                        pb: 0.5,
                      }}
                    >
                      {overskrift.navn}
                    </Typography>
                    
                    {hendelser.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2, fontStyle: 'italic' }}>
                        Ingen hendelser
                      </Typography>
                    ) : (
                      <Box sx={{ ml: 2 }}>
                        {hendelser.map((hendelse, idx) => (
                          <Box 
                            key={hendelse.id}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 1.5,
                              py: 1,
                              px: 1.5,
                              borderRadius: 1,
                              bgcolor: idx % 2 === 0 ? 'grey.50' : 'transparent',
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {hendelse.navn}
                              </Typography>
                            </Box>
                            {hendelse.varighet_minutter && (
                              <Chip 
                                icon={<AccessTime />}
                                label={`${hendelse.varighet_minutter} min`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}

              {plan && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Del av produksjonsplan: {plan.navn}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlanCard;


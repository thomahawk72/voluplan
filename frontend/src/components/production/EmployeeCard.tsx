import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Collapse,
  Alert,
} from '@mui/material';
import { Groups, ExpandMore, ExpandLess } from '@mui/icons-material';
import { Bemanning } from '../../services/api';

interface EmployeeCardProps {
  visible: boolean;
  bemanningStats: {
    totalt: number;
    bekreftet: number;
    planlagt: number;
    avlyst: number;
    ikkeSvart: number;
  };
  bemanningPerKategori: Record<string, Bemanning[]>;
  apneKategorier: Set<string>;
  onToggleKategori: (kategori: string) => void;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
  getStatusLabel: (status: string) => string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  visible,
  bemanningStats,
  bemanningPerKategori,
  apneKategorier,
  onToggleKategori,
  getStatusColor,
  getStatusLabel,
}) => {
  if (!visible) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Groups color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Medarbeidere
            </Typography>
          </Box>

          {/* Statistikk */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
            p: 3,
            bgcolor: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 2,
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {bemanningStats.totalt}
              </Typography>
              <Typography variant="caption" color="text.secondary">Totalt kalt inn</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {bemanningStats.bekreftet}
              </Typography>
              <Typography variant="caption" color="text.secondary">Bekreftet</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {bemanningStats.ikkeSvart}
              </Typography>
              <Typography variant="caption" color="text.secondary">Ikke svart</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'error.main' }}>
                {bemanningStats.avlyst}
              </Typography>
              <Typography variant="caption" color="text.secondary">Avslått</Typography>
            </Box>
          </Box>

          {bemanningStats.totalt === 0 ? (
            <Alert severity="info">Ingen medarbeidere er lagt til ennå</Alert>
          ) : (
            <Box>
              {Object.entries(bemanningPerKategori).map(([kategori, personer]) => (
                <Box key={kategori} sx={{ mb: 2 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                    onClick={() => onToggleKategori(kategori)}
                  >
                    <IconButton size="small">
                      {apneKategorier.has(kategori) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <Typography sx={{ fontWeight: 600 }}>
                      {kategori}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                      <Chip
                        label={`${personer.length} personer`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <Chip
                        label={`${personer.filter(p => p.status === 'bekreftet').length} bekreftet`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  </Box>
                  <Collapse in={apneKategorier.has(kategori)}>
                    <Box sx={{ overflow: 'hidden', borderRadius: 1, border: '1px solid', borderColor: 'divider', mt: 1 }}>
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'auto 1fr auto auto', 
                        bgcolor: 'grey.50',
                        p: 1,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'text.secondary'
                      }}>
                        <Box sx={{ px: 2 }}>Avatar</Box>
                        <Box>Talent • Person</Box>
                        <Box sx={{ textAlign: 'center' }}>Status</Box>
                        <Box sx={{ textAlign: 'center', px: 1 }}>Handlinger</Box>
                      </Box>
                      {personer.map((person, index) => (
                        <Box 
                          key={person.id}
                          sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'auto 1fr auto auto',
                            alignItems: 'center',
                            p: 1,
                            borderTop: index > 0 ? '1px solid' : 'none',
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'grey.50' }
                          }}
                        >
                          <Box sx={{ px: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {person.first_name[0]}{person.last_name[0]}
                            </Avatar>
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: { xs: 'wrap', sm: 'nowrap' },
                              rowGap: 0.25,
                              minWidth: 0,
                            }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {person.talent_navn}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.secondary' }}
                              >
                                • {person.first_name} {person.last_name}
                              </Typography>
                            </Box>
                            {person.notater && (
                              <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block' }}>
                                "{person.notater}"
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'center', px: 2 }}>
                            <Chip 
                              label={getStatusLabel(person.status)} 
                              color={getStatusColor(person.status)}
                              size="small"
                              sx={{ minWidth: 80 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small">
                              {/* Placeholder for actions */}
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeCard;


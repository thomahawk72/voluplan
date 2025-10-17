import React, { useState, useEffect } from 'react';
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
  Divider,
  Button,
  AvatarGroup,
  LinearProgress,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { 
  Groups, 
  ExpandMore, 
  ExpandLess, 
  CheckCircle, 
  HelpOutline, 
  Cancel, 
  PersonAdd,
  CheckCircleOutline,
  Warning,
  ViewList,
  Category,
} from '@mui/icons-material';
import { Bemanning } from '../../services/api';
import BemanningDrawer from './BemanningDrawer';

interface TalentBehov {
  id: number;
  produksjon_id: number;
  talent_id: number;
  talent_navn: string;
  talent_kategori: string;
  antall: number;
  beskrivelse?: string;
}

interface EmployeeCardProps {
  visible: boolean;
  produksjonId: number;
  bemanningStats: {
    totalt: number;
    bekreftet: number;
    planlagt: number;
    avlyst: number;
    ikkeSvart: number;
  };
  bemanningPerKategori: Record<string, Bemanning[]>;
  talentBehov: TalentBehov[];
  onRefresh: () => void;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
  getStatusLabel: (status: string) => string;
}

type ViewMode = 'priority' | 'category';

interface TalentBehovMedStatus extends TalentBehov {
  antallFylt: number;
  erFylt: boolean;
  tildelte: Bemanning[];
  progressPercent: number;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  visible,
  produksjonId,
  bemanningStats,
  bemanningPerKategori,
  talentBehov,
  onRefresh,
  getStatusColor,
  getStatusLabel,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<{
    talent_id: number;
    talent_navn: string;
    talent_kategori: string;
    antall: number;
    antallFylt: number;
  } | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('bemanning-view-mode');
    return (saved === 'category' ? 'category' : 'priority') as ViewMode;
  });
  
  const [showFullstendig, setShowFullstendig] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Lagre view-mode preference
  useEffect(() => {
    localStorage.setItem('bemanning-view-mode', viewMode);
  }, [viewMode]);

  // Helper: Hent alle bemanning flat
  const getAllBemanning = (): Bemanning[] => {
    return Object.values(bemanningPerKategori).flat();
  };

  // Helper: Hent antall fylt for et talent
  const getAntallFylt = (talentId: number): number => {
    const alleBemanning = getAllBemanning();
    return alleBemanning.filter(b => b.talent_id === talentId).length;
  };

  // Helper: Hent tildelte medarbeidere for et talent
  const getTildelteMedarbeidere = (talentId: number): Bemanning[] => {
    const alleBemanning = getAllBemanning();
    return alleBemanning.filter(b => b.talent_id === talentId);
  };

  // Bygg talent-behov med status
  const buildTalentBehovMedStatus = (): TalentBehovMedStatus[] => {
    return talentBehov.map(behov => {
      const antallFylt = getAntallFylt(behov.talent_id);
      const erFylt = antallFylt >= behov.antall;
      const tildelte = getTildelteMedarbeidere(behov.talent_id);
      const progressPercent = Math.min((antallFylt / behov.antall) * 100, 100);
      
      return {
        ...behov,
        antallFylt,
        erFylt,
        tildelte,
        progressPercent,
      };
    });
  };

  // Grupper talent-behov for prioritet-view
  const getTrengersOppmerksomhet = (talentList: TalentBehovMedStatus[]) => {
    return talentList.filter(t => !t.erFylt);
  };

  const getFullstendigBemannet = (talentList: TalentBehovMedStatus[]) => {
    return talentList.filter(t => t.erFylt);
  };

  // Grupper talent-behov per kategori for kategori-view
  const groupByKategori = (talentList: TalentBehovMedStatus[]) => {
    const grouped: Record<string, TalentBehovMedStatus[]> = {};
    
    talentList.forEach(talent => {
      const kategoriParts = talent.talent_kategori?.split(' → ') || [];
      const kategoriLabel = kategoriParts[kategoriParts.length - 1] || 'Ukjent';
      
      if (!grouped[kategoriLabel]) {
        grouped[kategoriLabel] = [];
      }
      grouped[kategoriLabel].push(talent);
    });
    
    return grouped;
  };

  // Beregn kategori-stats
  const getKategoriStats = (talentListe: TalentBehovMedStatus[]) => {
    const totalBehov = talentListe.reduce((sum, t) => sum + t.antall, 0);
    const totalFylt = talentListe.reduce((sum, t) => sum + t.antallFylt, 0);
    const progressPercent = totalBehov > 0 ? Math.min((totalFylt / totalBehov) * 100, 100) : 0;
    
    return { totalBehov, totalFylt, progressPercent };
  };

  const handleTalentClick = (behov: TalentBehovMedStatus) => {
    setSelectedTalent({
      talent_id: behov.talent_id,
      talent_navn: behov.talent_navn,
      talent_kategori: behov.talent_kategori,
      antall: behov.antall,
      antallFylt: behov.antallFylt,
    });
    setDrawerOpen(true);
  };

  const handleDrawerSuccess = () => {
    onRefresh();
  };

  const toggleCategory = (kategori: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kategori)) {
        newSet.delete(kategori);
      } else {
        newSet.add(kategori);
      }
      return newSet;
    });
  };

  if (!visible) return null;

  const talentBehovMedStatus = buildTalentBehovMedStatus();
  const trengersOppmerksomhet = getTrengersOppmerksomhet(talentBehovMedStatus);
  const fullstendigBemannet = getFullstendigBemannet(talentBehovMedStatus);
  const kategorier = groupByKategori(talentBehovMedStatus);

  return (
    <Box sx={{ mb: 3 }}>
      <Card sx={{ boxShadow: 3, position: 'relative', overflow: 'visible' }}>
        <CardContent sx={{ position: 'relative', minHeight: 400 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Groups color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Medarbeidere
              </Typography>
            </Box>

            {/* View mode toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="priority" aria-label="prioritet view">
                <Tooltip title="Prioritet-view">
                  <ViewList sx={{ fontSize: 18 }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="category" aria-label="kategori view">
                <Tooltip title="Kategori-view">
                  <Category sx={{ fontSize: 18 }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Kompakt stats-bar */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexWrap: 'nowrap',
            gap: { xs: 0.5, sm: 2 },
            mb: 3,
            p: { xs: 1, sm: 1.5 },
            bgcolor: 'rgba(102, 126, 234, 0.04)',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'rgba(102, 126, 234, 0.1)',
          }}>
            <Tooltip title="Totalt kalt inn">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.5 }, minWidth: 0 }}>
                <Groups sx={{ fontSize: { xs: 18, sm: 20 }, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {bemanningStats.totalt}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.75rem' }}>
                  totalt
                </Typography>
              </Box>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ opacity: 0.5 }} />
            <Tooltip title="Bekreftet">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.5 }, minWidth: 0 }}>
                <CheckCircle sx={{ fontSize: { xs: 18, sm: 20 }, color: 'success.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {bemanningStats.bekreftet}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.75rem' }}>
                  bekreftet
                </Typography>
              </Box>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ opacity: 0.5 }} />
            <Tooltip title="Avventer svar">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.5 }, minWidth: 0 }}>
                <HelpOutline sx={{ fontSize: { xs: 18, sm: 20 }, color: 'warning.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {bemanningStats.ikkeSvart}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.75rem' }}>
                  avventer
                </Typography>
              </Box>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ opacity: 0.5 }} />
            <Tooltip title="Avslått">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.5 }, minWidth: 0 }}>
                <Cancel sx={{ fontSize: { xs: 18, sm: 20 }, color: 'error.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {bemanningStats.avlyst}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.75rem' }}>
                  avslått
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {/* Tom state */}
          {talentBehov.length === 0 && (
            <Alert severity="info">
              Ingen talent-behov definert for denne produksjonen ennå.
            </Alert>
          )}

          {/* PRIORITET-VIEW */}
          {viewMode === 'priority' && talentBehov.length > 0 && (
            <Box>
              {/* Trenger oppmerksomhet */}
              {trengersOppmerksomhet.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Warning sx={{ color: 'warning.main' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Trenger oppmerksomhet ({trengersOppmerksomhet.length})
                    </Typography>
                  </Box>
                  {trengersOppmerksomhet.map((talent) => (
                    <TalentRow
                      key={talent.id}
                      talent={talent}
                      onBemanne={() => handleTalentClick(talent)}
                      getStatusLabel={getStatusLabel}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </Box>
              )}

              {/* Fullstendig bemannet */}
              {fullstendigBemannet.length > 0 && (
                <Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    onClick={() => setShowFullstendig(!showFullstendig)}
                  >
                    <CheckCircle sx={{ color: 'success.main' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                      Fullstendig bemannet ({fullstendigBemannet.length})
                    </Typography>
                    <IconButton size="small">
                      {showFullstendig ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  <Collapse in={showFullstendig}>
                    {fullstendigBemannet.map((talent) => (
                      <TalentRow
                        key={talent.id}
                        talent={talent}
                        onBemanne={() => handleTalentClick(talent)}
                        getStatusLabel={getStatusLabel}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </Collapse>
                </Box>
              )}
            </Box>
          )}

          {/* KATEGORI-VIEW */}
          {viewMode === 'category' && talentBehov.length > 0 && (
            <Box>
              {Object.entries(kategorier).map(([kategori, talentListe]) => {
                const stats = getKategoriStats(talentListe);
                const isExpanded = expandedCategories.has(kategori);

                return (
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
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                      onClick={() => toggleCategory(kategori)}
                    >
                      <IconButton size="small">
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                      <Typography sx={{ fontWeight: 600, flex: 1 }}>
                        {kategori}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stats.totalFylt}/{stats.totalBehov}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={stats.progressPercent}
                          sx={{ 
                            flex: 1,
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: stats.progressPercent === 100 ? 'success.main' : 'primary.main',
                              borderRadius: 3,
                            }
                          }} 
                        />
                      </Box>
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box sx={{ pl: 2, pt: 1 }}>
                        {talentListe.map((talent) => (
                          <TalentRow
                            key={talent.id}
                            talent={talent}
                            onBemanne={() => handleTalentClick(talent)}
                            getStatusLabel={getStatusLabel}
                            getStatusColor={getStatusColor}
                          />
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Bemanning Drawer */}
          <BemanningDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            produksjonId={produksjonId}
            selectedTalent={selectedTalent}
            onSuccess={handleDrawerSuccess}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

// TalentRow komponent for å vise et talent
interface TalentRowProps {
  talent: TalentBehovMedStatus;
  onBemanne: () => void;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
}

const TalentRow: React.FC<TalentRowProps> = ({ talent, onBemanne, getStatusLabel, getStatusColor }) => {
  const kategoriParts = talent.talent_kategori?.split(' → ') || [];
  const kategoriLabel = kategoriParts[kategoriParts.length - 1] || '';

  return (
    <Box 
      sx={{ 
        display: { xs: 'block', md: 'grid' },
        gridTemplateColumns: { md: '2fr 1fr 2fr 120px' },
        gap: 2,
        p: 2,
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.02)' },
        transition: 'background-color 0.2s',
      }}
    >
      {/* Talent-navn og kategori */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {talent.talent_navn}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {kategoriLabel}
        </Typography>
      </Box>

      {/* Progress og status */}
      <Box sx={{ mt: { xs: 1, md: 0 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: talent.erFylt ? 'success.main' : 'text.primary' }}>
            {talent.antallFylt}/{talent.antall}
          </Typography>
          {talent.erFylt && <CheckCircleOutline sx={{ fontSize: 16, color: 'success.main' }} />}
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={talent.progressPercent}
          sx={{ 
            height: 6, 
            borderRadius: 3,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: talent.erFylt ? 'success.main' : 'primary.main',
              borderRadius: 3,
            }
          }} 
        />
      </Box>

      {/* Tildelte personer */}
      <Box sx={{ mt: { xs: 1, md: 0 } }}>
        {talent.tildelte.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Ingen tildelt ennå
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <AvatarGroup max={4} sx={{ 
              '& .MuiAvatar-root': { 
                width: 32, 
                height: 32, 
                fontSize: '0.875rem',
                border: '2px solid white',
              }
            }}>
              {talent.tildelte.map((person) => (
                <Tooltip key={person.id} title={`${person.first_name} ${person.last_name} (${getStatusLabel(person.status)})`}>
                  <Avatar 
                    sx={{ 
                      bgcolor: person.status === 'bekreftet' ? 'success.main' : 
                               person.status === 'planlagt' ? 'primary.main' : 'grey.400'
                    }}
                  >
                    {person.first_name[0]}{person.last_name[0]}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
            {talent.tildelte.some(p => p.status === 'bekreftet') && (
              <Chip 
                label={`${talent.tildelte.filter(p => p.status === 'bekreftet').length} bekreftet`} 
                size="small" 
                color="success" 
              />
            )}
          </Box>
        )}
      </Box>

      {/* Bemanne-knapp */}
      <Box sx={{ mt: { xs: 2, md: 0 }, textAlign: { xs: 'left', md: 'center' } }}>
        <Button
          variant={talent.erFylt ? 'outlined' : 'contained'}
          size="small"
          startIcon={<PersonAdd />}
          onClick={onBemanne}
          sx={{ minWidth: { xs: '100%', md: '100px' } }}
        >
          {talent.erFylt ? 'Endre' : 'Bemanne'}
        </Button>
      </Box>
    </Box>
  );
};

export default EmployeeCard;

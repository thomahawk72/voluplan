import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Checkbox,
  Slide,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  PushPin as PinIcon,
  PushPinOutlined as UnpinIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  FilterList as FilterListIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { userAPI, produksjonAPI } from '../../services/api';

interface BemanningDrawerProps {
  open: boolean;
  onClose: () => void;
  produksjonId: number;
  selectedTalent: {
    talent_navn: string;
    talent_kategori: string;
    antall: number;
    antallFylt: number;
  } | null;
  onSuccess: () => void;
  onPinToggle: (pinned: boolean) => void;
  isPinned: boolean;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  talents: Array<{
    talent_id: number;
    talent_navn: string;
    talent_kategori: string;
    erfaringsnivaa: string;
    sertifisert: boolean;
  }>;
  allokertTalent?: string; // Hvilket talent personen allerede er allokert til i denne produksjonen
}

const BemanningDrawer: React.FC<BemanningDrawerProps> = ({
  open,
  onClose,
  produksjonId,
  selectedTalent,
  onSuccess,
  onPinToggle,
  isPinned,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tildeling, setTildeling] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showAllUsers, setShowAllUsers] = useState(false); // Toggle mellom "kun med talent" og "alle"

  const fetchUsers = useCallback(async () => {
    if (!selectedTalent) return;

    setLoading(true);
    setError(null);
    try {
      // Hent alle brukere med talents og bemanning
      const [usersData, bemanningData] = await Promise.all([
        userAPI.getAllWithTalents(), // Hent alle brukere med deres talents
        produksjonAPI.getBemanning(produksjonId)
      ]);
      
      let filteredUsers = usersData.users || [];

      // Filtrer på talent-navn hvis ikke "vis alle"
      if (!showAllUsers) {
        filteredUsers = filteredUsers.filter(user => 
          user.talents && user.talents.some((t: { talent_navn: string }) => t.talent_navn === selectedTalent.talent_navn)
        );
      }

      // Sett allokertTalent-property for de som allerede er allokert
      const usersWithAllokering = filteredUsers.map(user => {
        const existing = bemanningData.bemanning.find(b => b.person_id === user.id);
        return {
          ...user,
          allokertTalent: existing ? existing.talent_navn : undefined
        };
      });

      // Alfabetisk sortering på etternavn, fornavn
      usersWithAllokering.sort((a, b) => {
        const lastNameCompare = a.last_name.localeCompare(b.last_name, 'no');
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.first_name.localeCompare(b.first_name, 'no');
      });

      setUsers(usersWithAllokering);
    } catch (err: any) {
      console.error('Feil ved henting av brukere:', err);
      setError('Kunne ikke hente brukere');
    } finally {
      setLoading(false);
    }
  }, [selectedTalent, showAllUsers, produksjonId]);

  useEffect(() => {
    if (open && selectedTalent) {
      fetchUsers();
      setSelectedUsers(new Set()); // Reset selected users when talent changes
    }
  }, [open, selectedTalent?.talent_navn, showAllUsers, fetchUsers]); // Listen to talent_navn specifically

  const toggleUserSelection = (userId: number, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleTildelValgte = async () => {
    if (!selectedTalent || selectedUsers.size === 0) return;

    setTildeling(true);
    setError(null);
    
    try {
      // Tildel alle valgte brukere parallelt
      const promises = Array.from(selectedUsers).map(userId =>
        produksjonAPI.addBemanning(produksjonId, {
          personId: userId,
          talentNavn: selectedTalent.talent_navn,
          talentKategoriSti: selectedTalent.talent_kategori,
          status: 'planlagt',
        }).catch(err => {
          // Hvis allerede tildelt, ignorer denne feilen
          if (err.response?.status !== 400 || !err.response?.data?.error?.includes('allerede tildelt')) {
            throw err;
          }
          return null;
        })
      );

      await Promise.all(promises);
      
      onSuccess(); // Refresh data
      setSelectedUsers(new Set()); // Clear selection
      
      // Hvis ikke pinned, lukk drawer. Hvis pinned, hold åpen for neste talent
      if (!isPinned) {
        onClose();
      }
    } catch (err: any) {
      console.error('Feil ved tildeling:', err);
      setError(err.response?.data?.error || 'Kunne ikke tildele medarbeidere');
    } finally {
      setTildeling(false);
    }
  };

  const getErfaringsFarge = (erfaringsnivaa: string) => {
    switch (erfaringsnivaa) {
      case 'avansert': return 'success';
      case 'middels': return 'primary';
      case 'grunnleggende': return 'warning';
      default: return 'default';
    }
  };

  if (!open) return null; // Render nothing if not open

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: isPinned ? 'fixed' : 'absolute',
          top: isPinned ? 0 : 0,
          right: 0,
          bottom: isPinned ? 0 : 0,
          width: isPinned ? 400 : { xs: '100%', sm: 400 },
          bgcolor: 'background.paper',
          borderLeft: '2px solid',
          borderColor: 'divider',
          boxShadow: 4,
          zIndex: isPinned ? 1200 : 1100,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          key={selectedTalent?.talent_navn} // Force re-render when talent changes
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: isPinned ? 'primary.light' : 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            transition: 'background-color 0.2s',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Bemanne: {selectedTalent?.talent_navn}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {selectedTalent?.talent_kategori}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Trenger {selectedTalent?.antall}, har {selectedTalent?.antallFylt}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={() => onPinToggle(!isPinned)}
              color={isPinned ? 'primary' : 'default'}
              title={isPinned ? 'Løsne drawer' : 'Fest drawer'}
              size="small"
            >
              {isPinned ? <PinIcon /> : <UnpinIcon />}
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Toggle mellom "kun med talent" og "alle medarbeidere" */}
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={showAllUsers ? 'alle' : 'medTalent'}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  setShowAllUsers(newValue === 'alle');
                }
              }}
              size="small"
              fullWidth
            >
              <ToggleButton value="medTalent">
                <FilterListIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                Kun med talent
              </ToggleButton>
              <ToggleButton value="alle">
                <PeopleIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                Alle medarbeidere
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && users.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {showAllUsers 
                ? 'Ingen medarbeidere funnet' 
                : `Ingen medarbeidere med talentet "${selectedTalent?.talent_navn}"`}
            </Alert>
          )}

          {!loading && users.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.85rem' }}>
                {showAllUsers ? 'Alle medarbeidere' : 'Tilgjengelige medarbeidere'} ({users.length})
                {selectedUsers.size > 0 && ` • ${selectedUsers.size} valgt`}
              </Typography>
              <List sx={{ width: '100%', p: 0 }}>
                {users.map((user) => {
                  const userTalent = user.talents.find((t) => t.talent_navn === selectedTalent?.talent_navn);
                  const isSelected = selectedUsers.has(user.id);
                  const isAllokert = !!user.allokertTalent;
                  
                  return (
                    <ListItem
                      key={user.id}
                      sx={{
                        mb: 0.5,
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'primary.light' : isAllokert ? 'action.hover' : 'background.paper',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isSelected ? 'primary.light' : 'action.hover',
                          boxShadow: 1,
                        },
                      }}
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => toggleUserSelection(user.id, e as any)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ mr: 1, p: 0.5 }}
                      />
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: isSelected ? 'primary.main' : isAllokert ? 'warning.main' : 'grey.400',
                            width: 36,
                            height: 36,
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.first_name} {user.last_name}
                            </Typography>
                            {isAllokert && (
                              <Chip 
                                label={`Allokert: ${user.allokertTalent}`} 
                                size="small" 
                                color="warning" 
                                sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }} 
                              />
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          userTalent && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={userTalent.erfaringsnivaa}
                                size="small"
                                color={getErfaringsFarge(userTalent.erfaringsnivaa) as any}
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                              {userTalent.sertifisert && (
                                <Chip
                                  label="Sertifisert"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              )}
                            </Box>
                          )
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </Box>

        {/* Footer med Tildel-knapp */}
        {!loading && users.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleTildelValgte}
              disabled={tildeling || selectedUsers.size === 0}
              startIcon={tildeling ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            >
              {tildeling
                ? 'Tildeler...'
                : `Tildel ${selectedUsers.size} ${selectedUsers.size === 1 ? 'person' : 'personer'}`}
            </Button>
          </Box>
        )}
      </Box>
    </Slide>
  );
};

export default BemanningDrawer;

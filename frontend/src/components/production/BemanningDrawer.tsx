import React, { useState, useEffect } from 'react';
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
  Divider,
  Paper,
  Checkbox,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  PushPin as PinIcon,
  PushPinOutlined as UnpinIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { userAPI, produksjonAPI } from '../../services/api';

interface BemanningDrawerProps {
  open: boolean;
  onClose: () => void;
  produksjonId: number;
  selectedTalent: {
    talent_id: number;
    talent_navn: string;
    talent_kategori: string;
    antall: number;
    antallFylt: number;
  } | null;
  onSuccess: () => void;
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
}

const BemanningDrawer: React.FC<BemanningDrawerProps> = ({
  open,
  onClose,
  produksjonId,
  selectedTalent,
  onSuccess,
}) => {
  const [pinned, setPinned] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tildeling, setTildeling] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && selectedTalent) {
      fetchUsers();
      setSelectedUsers(new Set()); // Reset selected users when opening
    }
  }, [open, selectedTalent]);

  const fetchUsers = async () => {
    if (!selectedTalent) return;

    setLoading(true);
    setError(null);
    try {
      const data = await userAPI.getAllWithTalents(selectedTalent.talent_id);
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Feil ved henting av brukere:', err);
      setError('Kunne ikke hente brukere med dette talentet');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
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
          talentId: selectedTalent.talent_id,
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
      
      onSuccess();
      setSelectedUsers(new Set()); // Clear selection
      
      if (!pinned) {
        onClose();
      }
    } catch (err: any) {
      console.error('Feil ved tildeling:', err);
      setError('Kunne ikke tildele alle valgte personer');
    } finally {
      setTildeling(false);
    }
  };

  const handleClose = () => {
    if (!pinned) {
      onClose();
    }
  };

  const getErfaringsFarge = (erfaringsnivaa: string) => {
    switch (erfaringsnivaa) {
      case 'ekspert':
        return 'success';
      case 'erfaren':
        return 'primary';
      case 'middels':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!open) return null;

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: pinned ? 400 : { xs: '100%', sm: 400 },
          bgcolor: 'background.paper',
          borderLeft: '2px solid',
          borderColor: 'divider',
          boxShadow: 4,
          zIndex: pinned ? 1000 : 1100,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Bemanne: {selectedTalent?.talent_navn}
          </Typography>
          <Box>
            <IconButton
              onClick={() => setPinned(!pinned)}
              color={pinned ? 'primary' : 'default'}
              title={pinned ? 'Løsne drawer' : 'Fest drawer'}
              size="small"
            >
              {pinned ? <PinIcon /> : <UnpinIcon />}
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>

      {/* Talent info */}
      {selectedTalent && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
          <Typography variant="caption" color="text.secondary">
            Kategori
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {selectedTalent.talent_kategori}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={`${selectedTalent.antallFylt} / ${selectedTalent.antall} fylt`}
              color={selectedTalent.antallFylt >= selectedTalent.antall ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Paper>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Users list */}
      {!loading && users.length === 0 && (
        <Alert severity="info">
          Ingen medarbeidere har dette talentet ennå.
        </Alert>
      )}

      {!loading && users.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Tilgjengelige medarbeidere ({users.length})
            {selectedUsers.size > 0 && ` • ${selectedUsers.size} valgt`}
          </Typography>
          <List sx={{ width: '100%' }}>
            {users.map((user) => {
              const userTalent = user.talents.find((t) => t.talent_id === selectedTalent?.talent_id);
              const isSelected = selectedUsers.has(user.id);
              
              return (
                <ListItem
                  key={user.id}
                  sx={{
                    mb: 1,
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: isSelected ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: isSelected ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleUserSelection(user.id)}
                    sx={{ mr: 1 }}
                  />
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.400' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${user.first_name} ${user.last_name}`}
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" display="block">
                          {user.email}
                        </Typography>
                        {userTalent && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={userTalent.erfaringsnivaa}
                              size="small"
                              color={getErfaringsFarge(userTalent.erfaringsnivaa) as any}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            {userTalent.sertifisert && (
                              <Chip
                                label="Sertifisert"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
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
          <Box sx={{ 
            p: 2, 
            borderTop: '2px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            position: 'sticky',
            bottom: 0,
          }}>
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
                : `Tildel ${selectedUsers.size} ${selectedUsers.size === 1 ? 'person' : 'personer'}`
              }
            </Button>
          </Box>
        )}
      </Box>
    </Slide>
  );
};

export default BemanningDrawer;


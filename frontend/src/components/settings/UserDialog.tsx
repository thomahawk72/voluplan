import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Collapse,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Delete, PersonOff, CheckCircle, ExpandMore, ExpandLess, Lock, Warning } from '@mui/icons-material';
import { userAPI, talentAPI, UserTalent, Talent } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: number; // undefined = opprett ny
  onSave: () => void;
}

const UserDialog: React.FC<UserDialogProps> = ({ open, onClose, userId: initialUserId, onSave }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Brukerdata
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState(''); // For å detektere endringer
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  
  // Passordbekreftelse for e-postendring
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);

  // Talent-data
  const [userTalents, setUserTalents] = useState<UserTalent[]>([]);
  const [allTalents, setAllTalents] = useState<Talent[]>([]);
  const [expandedTalentId, setExpandedTalentId] = useState<number | null>(null);

  // Tracking av bruker-ID (kan endres fra undefined til number etter opprettelse)
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(initialUserId);
  const isEditMode = currentUserId !== undefined;
  const isAdmin = currentUser?.roles.includes('admin') || false;
  const isOwnProfile = currentUser?.id === currentUserId;

  useEffect(() => {
    if (open) {
      setCurrentUserId(initialUserId);
      fetchData(initialUserId); // Send userId direkte
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUserId]);

  const fetchData = async (userId?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Hent alle tilgjengelige talents
      const talentsData = await talentAPI.getAll();
      setAllTalents(talentsData.kompetanser || []);

      // Hvis edit mode, hent brukerdata og brukerens talents
      if (userId) {
        const [userData, userTalentsData] = await Promise.all([
          userAPI.getById(userId),
          userAPI.getUserTalents(userId),
        ]);

        const user = userData.user;
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setEmail(user.email);
        setOriginalEmail(user.email); // Lagre original e-post
        setPhoneNumber(user.phoneNumber || '');
        setIsActive(user.isActive ?? true);
        setRoles(user.roles || []);
        setUserTalents(userTalentsData.talents || []);
      }
    } catch (err: any) {
      console.error('Feil ved lasting av data:', err);
      setError('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentUserId(undefined);
    setFirstName('');
    setLastName('');
    setEmail('');
    setOriginalEmail('');
    setPhoneNumber('');
    setIsActive(true);
    setRoles([]);
    setUserTalents([]);
    setExpandedTalentId(null);
    setCurrentPassword('');
    setShowPasswordConfirm(false);
    setShowAdminConfirm(false);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        setError('Fornavn, etternavn og e-post er påkrevd');
        setLoading(false);
        return;
      }

      if (isEditMode && currentUserId) {
        // Oppdater eksisterende bruker
        const updateData: any = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          roles,
          isActive,
        };
        
        // Hvis e-post er endret, legg til i update
        if (email !== originalEmail) {
          updateData.email = email.trim();
          
          // Hvis passord er påkrevd, legg til
          if (currentPassword) {
            updateData.currentPassword = currentPassword;
          }
        }
        
        await userAPI.update(currentUserId, updateData);
        
        // Oppdater original e-post etter vellykket endring
        if (email !== originalEmail) {
          setOriginalEmail(email);
          setCurrentPassword('');
          setShowPasswordConfirm(false);
          setShowAdminConfirm(false);
        }
        
        setSuccess('Bruker oppdatert! Du kan fortsette å redigere eller lukke dialogen.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Opprett ny bruker
        const result = await userAPI.create({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          roles,
          isActive,
        });

        // Sett bruker-ID slik at vi går over i edit-mode
        setCurrentUserId(result.user.id);

        // Hvis talents er lagt til lokalt, legg dem til for den nye brukeren
        if (result.user && userTalents.length > 0) {
          // Legg til talents en etter en
          for (const talent of userTalents) {
            try {
              await userAPI.addUserTalent(result.user.id, {
                talentId: talent.talent_id,
                erfaringsnivaa: talent.erfaringsnivaa,
                notater: talent.notater,
              });
            } catch (talentErr: any) {
              console.error('Feil ved legg til talent:', talentErr);
              // Fortsett med neste talent selv om en feiler
            }
          }
        }
        setSuccess('Bruker opprettet! Legg til talents nedenfor.');
        setTimeout(() => setSuccess(null), 4000);
      }

      // Oppdater listen i bakgrunnen uten å lukke dialogen
      onSave();
    } catch (err: any) {
      console.error('Feil ved lagring:', err);
      setError(err.response?.data?.error || 'Kunne ikke lagre bruker');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTalent = async (talent: Talent) => {
    try {
      setError(null);

      // Sjekk om talent allerede er lagt til
      if (userTalents.some(t => t.talent_id === talent.id)) {
        setError('Dette talentet er allerede lagt til');
        setTimeout(() => setError(null), 3000);
        return;
      }

      if (isEditMode && currentUserId) {
        // Hvis edit mode, legg til i backend
        const result = await userAPI.addUserTalent(currentUserId, {
          talentId: talent.id,
          erfaringsnivaa: 'avansert',
        });

        setUserTalents([...userTalents, result.talent]);
        setExpandedTalentId(talent.id);
      } else {
        // Hvis opprett mode, legg til lokalt (lagres når bruker opprettes)
        const newTalent: UserTalent = {
          id: 0,
          bruker_id: 0,
          talent_id: talent.id,
          talent_navn: talent.navn,
          kategori_id: talent.kategori_id,
          kategori_navn: talent.kategori_navn || '',
          erfaringsnivaa: 'avansert',
          created_at: new Date().toISOString(),
        };
        setUserTalents([...userTalents, newTalent]);
        setExpandedTalentId(talent.id);
      }
    } catch (err: any) {
      console.error('Feil ved legg til talent:', err);
      setError(err.response?.data?.error || 'Kunne ikke legge til talent');
    }
  };

  const handleUpdateTalentDetail = async (
    talentId: number,
    field: 'erfaringsnivaa' | 'notater',
    value: any
  ) => {
    try {
      const talentIndex = userTalents.findIndex(t => t.talent_id === talentId);
      if (talentIndex === -1) return;

      const updatedTalents = [...userTalents];
      updatedTalents[talentIndex] = {
        ...updatedTalents[talentIndex],
        [field]: value,
      };
      setUserTalents(updatedTalents);

      // Hvis edit mode, oppdater i backend
      if (isEditMode && currentUserId) {
        await userAPI.updateUserTalent(currentUserId, talentId, {
          erfaringsnivaa: updatedTalents[talentIndex].erfaringsnivaa,
          notater: updatedTalents[talentIndex].notater,
        });
      }
    } catch (err: any) {
      console.error('Feil ved oppdatering:', err);
      setError('Kunne ikke oppdatere talent');
    }
  };

  const handleRemoveTalent = async (talentId: number) => {
    try {
      setError(null);

      if (isEditMode && currentUserId) {
        await userAPI.removeUserTalent(currentUserId, talentId);
      }

      setUserTalents(userTalents.filter(t => t.talent_id !== talentId));
    } catch (err: any) {
      console.error('Feil ved fjerning av talent:', err);
      setError(err.response?.data?.error || 'Kunne ikke fjerne talent');
    }
  };

  const handleRoleToggle = (role: string) => {
    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  // Tilgjengelige talents (ikke allerede lagt til)
  const availableTalents = allTalents.filter(
    t => !userTalents.some(ut => ut.talent_id === t.id)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Rediger bruker' : 'Opprett ny bruker'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {/* Grunnleggende info */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: -1 }}>
            Grunnleggende informasjon
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Fornavn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Etternavn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading}
            />
          </Box>

          <TextField
            fullWidth
            label="E-post"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // Vis passord-felt hvis bruker endrer sin egen e-post og har passord
              if (isEditMode && isOwnProfile && e.target.value !== originalEmail) {
                setShowPasswordConfirm(true);
              } else if (e.target.value === originalEmail) {
                setShowPasswordConfirm(false);
                setCurrentPassword('');
              }
              // Vis admin-bekreftelse hvis admin endrer andres e-post
              if (isEditMode && isAdmin && !isOwnProfile && e.target.value !== originalEmail) {
                setShowAdminConfirm(true);
              } else if (e.target.value === originalEmail) {
                setShowAdminConfirm(false);
              }
            }}
            required
            disabled={loading}
            InputProps={email !== originalEmail && isEditMode ? {
              endAdornment: (
                <InputAdornment position="end">
                  {isOwnProfile ? <Lock fontSize="small" color="warning" /> : <Warning fontSize="small" color="error" />}
                </InputAdornment>
              ),
            } : undefined}
            helperText={
              !isEditMode ? '' :
              email !== originalEmail && isOwnProfile ? '⚠️ Du endrer din påloggings-e-post' :
              email !== originalEmail && isAdmin ? '⚠️ Du endrer brukerens påloggings-e-post' : ''
            }
          />

          {/* Passordbekreftelse ved e-postendring (egen profil) */}
          {showPasswordConfirm && isOwnProfile && (
            <Alert severity="warning" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Sikkerhet: Bekreft med passord
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="password"
                label="Nåværende passord"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Alert>
          )}

          {/* Admin-bekreftelse ved e-postendring (andre brukere) */}
          {showAdminConfirm && isAdmin && !isOwnProfile && (
            <Alert severity="error">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ⚠️ Admin-handling: E-postendring
              </Typography>
              <Typography variant="caption">
                Du er i ferd med å endre brukerens påloggings-e-post fra <strong>{originalEmail}</strong> til <strong>{email}</strong>.
                Dette vil påvirke hvordan brukeren logger inn. Denne endringen blir logget.
              </Typography>
            </Alert>
          )}

          <TextField
            fullWidth
            label="Telefonnummer"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
          />

          {/* Roller */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              Roller
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {['admin', 'user', 'viewer'].map(role => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  color={roles.includes(role) ? 'primary' : 'default'}
                  onClick={() => handleRoleToggle(role)}
                  disabled={loading}
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Box>
          </Box>

          {/* Aktiv status */}
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isActive ? (
                  <>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography>Aktiv bruker (kan logge inn)</Typography>
                  </>
                ) : (
                  <>
                    <PersonOff color="warning" fontSize="small" />
                    <Typography>Kun talent (kan ikke logge inn)</Typography>
                  </>
                )}
              </Box>
            }
          />

          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }} />

          {/* Talents */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Talents ({userTalents.length})
            </Typography>

            {/* Quick-add autocomplete */}
            <Autocomplete
              options={availableTalents}
              getOptionLabel={(option) => `${option.navn} • ${option.kategori_navn}`}
              onChange={(_, newValue) => {
                if (newValue) {
                  handleAddTalent(newValue);
                }
              }}
              value={null}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Søk og legg til talent..." 
                  size="small"
                />
              )}
              disabled={loading}
              noOptionsText="Ingen flere tilgjengelige talents"
            />

            {/* Kompakt talent-liste */}
            {userTalents.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {userTalents.map((talent) => (
                  <Paper 
                    key={talent.talent_id} 
                    variant="outlined" 
                    sx={{ 
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  >
                    {/* Talent header - alltid synlig */}
                    <Box
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        bgcolor: expandedTalentId === talent.talent_id ? 'primary.50' : 'transparent',
                      }}
                      onClick={() => setExpandedTalentId(
                        expandedTalentId === talent.talent_id ? null : talent.talent_id
                      )}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            rowGap: 0.25,
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {talent.talent_navn}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {talent.kategori_navn}
                          </Typography>
                          <Chip 
                            label={talent.erfaringsnivaa}
                            size="small"
                            color="primary"
                            sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTalent(talent.talent_id);
                          }}
                          disabled={loading}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          {expandedTalentId === talent.talent_id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Expandable detaljer */}
                    <Collapse in={expandedTalentId === talent.talent_id}>
                      <Box sx={{ p: 2, pt: 0, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <InputLabel>Erfaringsnivå</InputLabel>
                          <Select
                            value={talent.erfaringsnivaa}
                            label="Erfaringsnivå"
                            onChange={(e) => handleUpdateTalentDetail(
                              talent.talent_id,
                              'erfaringsnivaa',
                              e.target.value
                            )}
                            disabled={loading}
                          >
                            <MenuItem value="grunnleggende">Grunnleggende</MenuItem>
                            <MenuItem value="middels">Middels</MenuItem>
                            <MenuItem value="avansert">Avansert</MenuItem>
                            <MenuItem value="ekspert">Ekspert</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          size="small"
                          label="Notater"
                          multiline
                          rows={2}
                          value={talent.notater || ''}
                          onChange={(e) => handleUpdateTalentDetail(
                            talent.talent_id,
                            'notater',
                            e.target.value
                          )}
                          onBlur={(e) => {
                            // Oppdater bare hvis edit mode
                            if (isEditMode && currentUserId) {
                              handleUpdateTalentDetail(
                                talent.talent_id,
                                'notater',
                                e.target.value
                              );
                            }
                          }}
                          disabled={loading}
                          placeholder="Notater om erfaring..."
                        />
                      </Box>
                    </Collapse>
                  </Paper>
                ))}
              </Box>
            )}

            {userTalents.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Ingen talents lagt til ennå
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {isEditMode ? 'Talents lagres automatisk' : 'Opprett bruker først, deretter legg til talents'}
          </Typography>
        </Box>
        <Button onClick={onClose} disabled={loading}>
          {success ? 'Lukk' : 'Avbryt'}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || (isEditMode && success !== null)}>
          {isEditMode ? 'Lagre endringer' : 'Opprett bruker'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog;


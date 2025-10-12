import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Button,
  Typography,
  MenuItem,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Delete, Search, FilterList, Add, Edit, PersonOff } from '@mui/icons-material';
import { userAPI, talentAPI, User, TalentKategori } from '../../services/api';
import UserDialog from './UserDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [kategorier, setKategorier] = useState<TalentKategori[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter og søk
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('');
  
  // Valgte brukere
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userData, kategoriData] = await Promise.all([
        userAPI.getAll(),
        talentAPI.getAllKategorier(),
      ]);
      setUsers(userData.users || []);
      setKategorier(kategoriData.kategorier || []);
    } catch (err: any) {
      console.error('Feil ved lasting av brukere:', err);
      setError('Kunne ikke laste brukere');
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await userAPI.delete(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunne ikke slette bruker');
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleBulkDeleteClick = () => {
    if (selectedUsers.size === 0) return;
    
    // Finn de valgte brukerne
    const usersToDelete = users.filter(u => selectedUsers.has(u.id));
    if (usersToDelete.length > 0) {
      // Bruk første bruker som representant for bulk-sletting
      setUserToDelete({
        ...usersToDelete[0],
        firstName: `${selectedUsers.size} brukere`,
        lastName: '',
      });
      setDeleteDialogOpen(true);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      await userAPI.bulkDelete(Array.from(selectedUsers));
      setSelectedUsers(new Set());
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunne ikke slette brukere');
      setDeleteDialogOpen(false);
    }
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleOpenDialog = (userId?: number) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUserId(undefined);
  };

  const handleDialogSave = async () => {
    await fetchData();
    // La dialogen forbli åpen slik at brukeren kan fortsette å legge til talents
  };

  const handleRowClick = (userId: number) => {
    handleOpenDialog(userId);
  };

  // Filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKategori = filterKategori === '' ||
      (user.talents && user.talents.includes(filterKategori));
    
    return matchesSearch && matchesKategori;
  });

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header med "Legg til bruker" knapp */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Brukere</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Legg til bruker
        </Button>
      </Box>

      {/* Søk og filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Søk etter navn eller e-post..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Filtrer på kategori"
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FilterList />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="">Alle kategorier</MenuItem>
          {kategorier
            .filter(k => !k.parent_id)
            .map(k => (
              <MenuItem key={k.id} value={k.navn}>
                {k.navn}
              </MenuItem>
            ))}
        </TextField>
      </Box>

      {/* Bulk actions */}
      {selectedUsers.size > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ flexGrow: 1, alignSelf: 'center' }}>
            {selectedUsers.size} brukere valgt
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={handleBulkDeleteClick}
            size="small"
          >
            Slett valgte
          </Button>
        </Box>
      )}

      {/* Bruker-tabell */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                  indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell>Navn</TableCell>
              <TableCell>E-post</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Roller</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Handlinger</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow 
                key={user.id} 
                hover 
                sx={{ cursor: 'pointer' }}
              >
                <TableCell 
                  padding="checkbox"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell onClick={() => handleRowClick(user.id)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                    {!user.isActive && (
                      <PersonOff fontSize="small" color="warning" titleAccess="Kun talent" />
                    )}
                  </Box>
                </TableCell>
                <TableCell onClick={() => handleRowClick(user.id)}>{user.email}</TableCell>
                <TableCell onClick={() => handleRowClick(user.id)}>{user.phoneNumber || '-'}</TableCell>
                <TableCell onClick={() => handleRowClick(user.id)}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.roles?.map(role => (
                      <Chip key={role} label={role} size="small" color="primary" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell onClick={() => handleRowClick(user.id)}>
                  <Chip 
                    label={user.isActive ? 'Aktiv' : 'Kun talent'} 
                    color={user.isActive ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(user.id)}
                    sx={{ mr: 1 }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteClick(user)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredUsers.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchTerm || filterKategori ? 'Ingen brukere matcher søket' : 'Ingen brukere funnet'}
        </Alert>
      )}

      {/* User Dialog */}
      <UserDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        userId={selectedUserId}
        onSave={handleDialogSave}
      />

      {/* Delete Confirmation Dialog */}
      {userToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={selectedUsers.size > 0 ? handleBulkDeleteConfirm : handleDeleteConfirm}
          userName={userToDelete.firstName + (userToDelete.lastName ? ' ' + userToDelete.lastName : '')}
        />
      )}
    </Box>
  );
};

export default UserManagement;


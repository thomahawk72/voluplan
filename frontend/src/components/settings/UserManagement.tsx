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
import { Delete, Search, FilterList } from '@mui/icons-material';
import { userAPI, talentAPI, User, TalentKategori } from '../../services/api';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [kategorier, setKategorier] = useState<TalentKategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter og søk
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('');
  
  // Valgte brukere
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, kategoriData] = await Promise.all([
        userAPI.getAll(),
        talentAPI.getAllKategorier(),
      ]);
      setUsers(userData.users || []);
      setKategorier(kategoriData.kategorier || []);
    } catch (err: any) {
      console.error('Feil ved lasting av brukere:', err);
      setError('Kunne ikke laste brukere');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Er du sikker på at du vil slette ${name}?`)) {
      return;
    }
    
    try {
      await userAPI.delete(id);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunne ikke slette bruker');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!window.confirm(`Er du sikker på at du vil slette ${selectedUsers.size} brukere?`)) {
      return;
    }
    
    try {
      await userAPI.bulkDelete(Array.from(selectedUsers));
      setSelectedUsers(new Set());
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunne ikke slette brukere');
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
            onClick={handleBulkDelete}
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
              <TableRow key={user.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phoneNumber || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.roles?.map(role => (
                      <Chip key={role} label={role} size="small" color="primary" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.isActive ? 'Aktiv' : 'Inaktiv'} 
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
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
    </Box>
  );
};

export default UserManagement;


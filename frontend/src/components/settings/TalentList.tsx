import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Talent } from '../../services/api';

interface TalentListProps {
  talenter: Talent[];
  onEdit: (talent: Talent) => void;
  onDelete: (id: number, navn: string) => void;
}

const TalentList: React.FC<TalentListProps> = ({ talenter, onEdit, onDelete }) => {
  return (
    <Box sx={{ mt: 1 }}>
      {talenter.map(talent => (
        <Box
          key={talent.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1,
            bgcolor: 'grey.100',
            borderRadius: 1,
            mb: 0.5,
            '&:hover': { bgcolor: 'grey.200' }
          }}
        >
          <Typography sx={{ flexGrow: 1, fontSize: '0.9rem' }}>
            {talent.navn}
          </Typography>
          {talent.beskrivelse && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 200, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}
            >
              {talent.beskrivelse}
            </Typography>
          )}
          <IconButton size="small" onClick={() => onEdit(talent)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(talent.id, talent.navn)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
};

export default TalentList;


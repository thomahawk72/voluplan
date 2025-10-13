import React from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  TextField, 
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { Talent } from '../../services/api';

export interface TalentSelection {
  talent: Talent;
  selected: boolean;
  antall: number;
  beskrivelse: string;
}

interface SelectableTalentListProps {
  selections: TalentSelection[];
  onToggle: (index: number) => void;
  onAntallChange: (index: number, antall: number) => void;
  onBeskrivelseChange: (index: number, beskrivelse: string) => void;
}

const SelectableTalentList: React.FC<SelectableTalentListProps> = ({
  selections,
  onToggle,
  onAntallChange,
  onBeskrivelseChange,
}) => {
  return (
    <Box sx={{ mt: 1 }}>
      {selections.map((selection, index) => (
        <Box
          key={selection.talent.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: 1.5,
            bgcolor: selection.selected ? 'action.selected' : 'grey.100',
            borderRadius: 1,
            mb: 0.5,
            border: selection.selected ? 2 : 0,
            borderColor: 'primary.main',
            transition: 'all 0.2s',
            '&:hover': { 
              bgcolor: selection.selected ? 'action.selected' : 'grey.200',
              boxShadow: 1,
            }
          }}
        >
          {/* Første rad: Checkbox og navn */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox
              checked={selection.selected}
              onChange={() => onToggle(index)}
              size="small"
            />
            <Typography sx={{ flexGrow: 1, fontSize: '0.9rem', fontWeight: selection.selected ? 600 : 400 }}>
              {selection.talent.navn}
            </Typography>
          </Box>

          {/* Andre rad: Antall og beskrivelse (kun hvis valgt) */}
          {selection.selected && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              pl: 4,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}>
              {/* Antall-velger */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => onAntallChange(index, selection.antall - 1)}
                  disabled={selection.antall <= 1}
                  sx={{ 
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'grey.200' },
                  }}
                >
                  <Remove fontSize="small" />
                </IconButton>
                <TextField
                  type="number"
                  value={selection.antall}
                  onChange={(e) => onAntallChange(index, parseInt(e.target.value) || 1)}
                  size="small"
                  sx={{ 
                    width: 90,
                    '& input': { textAlign: 'center', fontWeight: 600 }
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">stk</InputAdornment>,
                  }}
                  inputProps={{ min: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => onAntallChange(index, selection.antall + 1)}
                  sx={{ 
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'grey.200' },
                  }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Box>

              {/* Beskrivelse */}
              <TextField
                placeholder="Beskrivelse (valgfri)"
                value={selection.beskrivelse}
                onChange={(e) => onBeskrivelseChange(index, e.target.value)}
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                multiline
                maxRows={2}
              />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default SelectableTalentList;


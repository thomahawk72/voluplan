import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Collapse,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Folder,
  FolderOpen,
  Category,
  Clear,
} from '@mui/icons-material';
import { TalentKategori } from '../../services/api';
import SelectableTalentList, { TalentSelection } from './SelectableTalentList';

interface SelectableTalentTreeProps {
  kategorier: TalentKategori[];
  selectionsByKategori: Map<number, TalentSelection[]>;
  apneKategorier: Set<number>;
  onToggle: (id: number) => void;
  onTalentToggle: (kategoriId: number, index: number) => void;
  onAntallChange: (kategoriId: number, index: number, antall: number) => void;
  onBeskrivelseChange: (kategoriId: number, index: number, beskrivelse: string) => void;
  onClearKategori: (kategoriId: number) => void;
  getChildren: (parentId: number) => TalentKategori[];
}

const SelectableTalentTree: React.FC<SelectableTalentTreeProps> = ({
  kategorier,
  selectionsByKategori,
  apneKategorier,
  onToggle,
  onTalentToggle,
  onAntallChange,
  onBeskrivelseChange,
  onClearKategori,
  getChildren,
}) => {
  const renderKategori = (kategori: TalentKategori, level: number): React.ReactElement => {
    const children = getChildren(kategori.id);
    const selections = selectionsByKategori.get(kategori.id) || [];
    const harChildren = children.length > 0;
    const harTalenter = selections.length > 0;
    const selectedCount = selections.filter(s => s.selected).length;
    
    const getBgColor = () => {
      if (selectedCount > 0) {
        if (level === 0) return 'primary.main';
        if (level === 1) return 'secondary.main';
        return 'info.light';
      }
      return 'grey.300';
    };
    
    const getHoverColor = () => {
      if (selectedCount > 0) {
        if (level === 0) return 'primary.dark';
        if (level === 1) return 'secondary.dark';
        return 'info.main';
      }
      return 'grey.400';
    };

    const getIcon = () => {
      if (level === 0) return <Folder />;
      if (level === 1) return <FolderOpen fontSize="small" />;
      return <Category fontSize="small" />;
    };

    return (
      <Box key={kategori.id} sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: level === 0 ? 2 : 1.5,
            bgcolor: getBgColor(),
            color: 'white',
            borderRadius: 1,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: getHoverColor() }
          }}
          onClick={() => onToggle(kategori.id)}
        >
          <IconButton size="small" sx={{ color: 'white' }}>
            {apneKategorier.has(kategori.id) ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          {getIcon()}
          <Typography sx={{ fontWeight: level === 0 ? 600 : 500, flexGrow: 1 }}>
            {kategori.navn}
          </Typography>
          {harChildren && (
            <Chip 
              label={`${children.length} sub`} 
              size="small" 
              sx={{ bgcolor: 'white', color: getBgColor() }}
            />
          )}
          {harTalenter && (
            <Chip 
              label={`${selections.length} talenter`} 
              size="small" 
              sx={{ bgcolor: 'white', color: getBgColor() }}
            />
          )}
          {selectedCount > 0 && (
            <>
              <Chip 
                label={`${selectedCount} valgt`} 
                size="small" 
                color="secondary"
                sx={{ bgcolor: 'white', color: 'secondary.main', fontWeight: 600 }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearKategori(kategori.id);
                }}
                sx={{ 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Clear fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        <Collapse in={apneKategorier.has(kategori.id)}>
          <Box sx={{ pl: 4, mt: 1 }}>
            {/* Sub-kategorier (rekursivt) */}
            {children.map(child => renderKategori(child, level + 1))}
            
            {/* Talenter for denne kategorien */}
            {harTalenter && (
              <SelectableTalentList 
                selections={selections}
                onToggle={(index) => onTalentToggle(kategori.id, index)}
                onAntallChange={(index, antall) => onAntallChange(kategori.id, index, antall)}
                onBeskrivelseChange={(index, beskrivelse) => onBeskrivelseChange(kategori.id, index, beskrivelse)}
              />
            )}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const rootKategorier = kategorier.filter(k => !k.parent_id);

  return (
    <Box>
      {rootKategorier.map(root => renderKategori(root, 0))}
    </Box>
  );
};

export default SelectableTalentTree;


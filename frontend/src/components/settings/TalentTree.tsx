import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  ExpandMore,
  ExpandLess,
  Folder,
  FolderOpen,
  Category,
} from '@mui/icons-material';
import { TalentKategori, Talent } from '../../services/api';
import TalentList from './TalentList';

interface TalentTreeProps {
  kategorier: TalentKategori[];
  talenter: Talent[];
  apneKategorier: Set<number>;
  onToggle: (id: number) => void;
  onEditKategori: (kategori: TalentKategori) => void;
  onDeleteKategori: (id: number, navn: string) => void;
  onCreateSubKategori: (parentId: number) => void;
  onCreateTalent: (kategoriId: number) => void;
  onEditTalent: (talent: Talent) => void;
  onDeleteTalent: (id: number, navn: string, kategoriNavn?: string) => void;
  getChildren: (parentId: number) => TalentKategori[];
  getTalenterForKategori: (kategoriId: number) => Talent[];
}

const TalentTree: React.FC<TalentTreeProps> = ({
  kategorier,
  talenter,
  apneKategorier,
  onToggle,
  onEditKategori,
  onDeleteKategori,
  onCreateSubKategori,
  onCreateTalent,
  onEditTalent,
  onDeleteTalent,
  getChildren,
  getTalenterForKategori,
}) => {
  const renderKategori = (kategori: TalentKategori, level: number): React.ReactElement => {
    const children = getChildren(kategori.id);
    const talenterIKategori = getTalenterForKategori(kategori.id);
    const harChildren = children.length > 0;
    const harTalenter = talenterIKategori.length > 0;
    
    const getBgColor = () => {
      if (level === 0) return 'primary.main';
      if (level === 1) return 'secondary.main';
      return 'info.light';
    };
    
    const getHoverColor = () => {
      if (level === 0) return 'primary.dark';
      if (level === 1) return 'secondary.dark';
      return 'info.main';
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
              label={`${talenterIKategori.length} talenter`} 
              size="small" 
              sx={{ bgcolor: 'white', color: getBgColor() }}
            />
          )}
          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); onEditKategori(kategori); }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); onDeleteKategori(kategori.id, kategori.navn); }}>
            <Delete fontSize="small" />
          </IconButton>
          {!harTalenter && (
            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); onCreateSubKategori(kategori.id); }}>
              <Add fontSize="small" />
            </IconButton>
          )}
          {!harChildren && (
            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); onCreateTalent(kategori.id); }}>
              <Add fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Collapse in={apneKategorier.has(kategori.id)}>
          <Box sx={{ pl: 4, mt: 1 }}>
            {/* Sub-kategorier (rekursivt) */}
            {children.map(child => renderKategori(child, level + 1))}
            
            {/* Talenter for denne kategorien */}
            {harTalenter && (
              <TalentList 
                talenter={talenterIKategori}
                onEdit={onEditTalent}
                onDelete={onDeleteTalent}
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

export default TalentTree;


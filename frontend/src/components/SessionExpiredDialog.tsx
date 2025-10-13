import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SessionExpiredDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handler = () => {
      setOpen(true);
    };
    window.addEventListener('session-expired', handler as EventListener);
    return () => window.removeEventListener('session-expired', handler as EventListener);
  }, []);

  const handleOk = async () => {
    setOpen(false);
    try {
      await logout();
    } catch {}
    navigate('/login');
  };

  return (
    <Dialog open={open} onClose={handleOk} aria-labelledby="session-expired-title">
      <DialogTitle id="session-expired-title">Sesjonen er utløpt</DialogTitle>
      <DialogContent>
        <Typography>
          Du har vært inaktiv en stund, eller sesjonen din er utløpt. Vennligst logg inn på nytt for å fortsette.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleOk} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionExpiredDialog;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from './common/ConfirmDialog';

const SessionExpiredDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('session-expired', handler as EventListener);
    return () => window.removeEventListener('session-expired', handler as EventListener);
  }, []);

  const handleConfirm = async () => {
    setOpen(false);
    try { await logout(); } catch {}
    navigate('/login');
  };

  return (
    <ConfirmDialog
      open={open}
      title="Sesjonen er utløpt"
      message="Du har vært inaktiv en stund, eller sesjonen er utløpt. Logg inn på nytt for å fortsette."
      confirmText="OK"
      cancelText="Avbryt"
      onConfirm={handleConfirm}
      onCancel={() => setOpen(false)}
    />
  );
};

export default SessionExpiredDialog;

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { authAPI } from '../services/api';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Token is set as httpOnly cookie by backend during OAuth callback
      // Just verify authentication and redirect
      authAPI.getCurrentUser()
        .then(() => {
          navigate('/dashboard');
        })
        .catch((error) => {
          console.error('Failed to get user info:', error);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'white' }}>
        Logger inn...
      </Typography>
    </Box>
  );
};

export default AuthCallback;


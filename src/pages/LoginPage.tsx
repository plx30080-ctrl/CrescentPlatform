import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, type UserRole } from '../lib/constants';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('recruiter');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('Display name is required.');
          setSubmitting(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password, displayName.trim(), role);
        if (signUpError) {
          setError(signUpError.message);
          setSubmitting(false);
          return;
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
          setSubmitting(false);
          return;
        }
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    market_manager: 'Market Manager',
    recruiter: 'Recruiter',
    onsite_manager: 'Onsite Manager',
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}
            >
              CrescentPlatform
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              autoComplete="email"
              autoFocus
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />

            {isSignUp && (
              <>
                <TextField
                  label="Display Name"
                  fullWidth
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  sx={{ mb: 2 }}
                  autoComplete="name"
                />

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    label="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    {USER_ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {roleLabels[r]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={submitting}
              sx={{ mb: 2, py: 1.2 }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => {
                  setIsSignUp((prev) => !prev);
                  setError('');
                }}
                underline="hover"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

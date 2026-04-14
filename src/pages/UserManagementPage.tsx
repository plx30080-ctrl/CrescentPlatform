import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import { getUsers, updateUserRole } from '../services/userService';
import { USER_ROLES } from '../lib/constants';
import type { UserRole } from '../lib/constants';
import type { AppUser } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  market_manager: 'Market Manager',
  recruiter: 'Recruiter',
  onsite_manager: 'Onsite Manager',
};

const ROLE_COLORS: Record<UserRole, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  admin: 'error',
  market_manager: 'warning',
  recruiter: 'info',
  onsite_manager: 'success',
};

export default function UserManagementPage() {
  const { appUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingId(userId);
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showSuccess('Role updated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  if (appUser?.role !== 'admin') {
    return (
      <Alert severity="error">
        You do not have permission to access this page.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        User Management
      </Typography>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Display Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Role</TableCell>
                    <TableCell>Change Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{user.display_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={ROLE_LABELS[user.role] ?? user.role}
                          size="small"
                          color={ROLE_COLORS[user.role] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {user.id === appUser?.id ? (
                          <Typography variant="body2" color="text.secondary">
                            (your account)
                          </Typography>
                        ) : (
                          <Select
                            size="small"
                            value={user.role}
                            disabled={updatingId === user.id}
                            onChange={(e: SelectChangeEvent) =>
                              handleRoleChange(user.id, e.target.value as UserRole)
                            }
                            sx={{ minWidth: 160 }}
                          >
                            {USER_ROLES.map((role) => (
                              <MenuItem key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PrivateRoute from './components/layout/PrivateRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AssociatesPage from './pages/AssociatesPage';
import AssociateProfilePage from './pages/AssociateProfilePage';
import BadgeManagementPage from './pages/BadgeManagementPage';
import DataEntryPage from './pages/DataEntryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EarlyLeavesPage from './pages/EarlyLeavesPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="associates" element={<AssociatesPage />} />
                  <Route path="associates/:eid" element={<AssociateProfilePage />} />
                  <Route path="badges" element={<BadgeManagementPage />} />
                  <Route path="data-entry" element={<DataEntryPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="early-leaves" element={<EarlyLeavesPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

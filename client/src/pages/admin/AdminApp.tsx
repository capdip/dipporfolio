import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/Providers';
import LoginForm from '../../components/admin/LoginForm';
import AdminLayout from '../../components/admin/AdminLayout';
import Dashboard from '../../components/admin/Dashboard';
import ResourceManager from '../../components/admin/ResourceManager';
import MediaLibrary from '../../components/admin/MediaLibrary';
import CvManager from '../../components/admin/CvManager';
import BlogEditor from '../../components/admin/BlogEditor';
import Inbox from '../../components/admin/Inbox';
import AboutEditor from '../../components/admin/AboutEditor';
import SettingsEditor from '../../components/admin/SettingsEditor';
import ThemeEditor from '../../components/admin/ThemeEditor';
import AuditLogViewer from '../../components/admin/AuditLogViewer';

const Splash = () => (
  <div className="flex min-h-screen items-center justify-center bg-surface">
    <div
      role="status"
      aria-label="Loading admin"
      className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
    />
  </div>
);

export default function AdminApp() {
  const { user, loading } = useAuth();

  if (loading) return <Splash />;

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginForm />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="login" element={<Navigate to="/admin" replace />} />
        <Route path="about" element={<AboutEditor />} />
        <Route path="resources/:resource" element={<ResourceManager />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="cv" element={<CvManager />} />
        <Route path="blog" element={<BlogEditor />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="settings" element={<SettingsEditor />} />
        <Route path="theme" element={<ThemeEditor />} />
        <Route path="audit" element={<AuditLogViewer />} />
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="font-heading text-6xl font-bold text-primary">404</p>
              <p className="text-muted">This admin page does not exist.</p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

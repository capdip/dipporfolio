import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, ThemeProvider } from './context/Providers';
import PublicLayout from './components/layout/PublicLayout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import PublicationDetailPage from './pages/PublicationDetailPage';
import PublicationsPage from './pages/PublicationsPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminApp from './pages/admin/AdminApp';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/:slug" element={<BlogPostPage />} />
              <Route path="publications" element={<PublicationsPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="publications/:id" element={<PublicationDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

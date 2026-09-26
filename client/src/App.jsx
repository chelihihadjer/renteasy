import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AddProperty from './pages/AddProperty.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import Conversation from './pages/Conversation.jsx';
import EditProperty from './pages/EditProperty.jsx';
import Favorites from './pages/Favorites.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import MyRequests from './pages/MyRequests.jsx';
import NotFound from './pages/NotFound.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const { pathname } = useLocation();
useEffect(() => {
  window.scrollTo(0, 0);
}, [pathname]);

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/logement/:id" element={<PropertyDetail />} />

          <Route path="/favoris" element={<ProtectedRoute role="tenant"><Favorites /></ProtectedRoute>} />
          <Route path="/mes-demandes" element={<ProtectedRoute role="tenant"><MyRequests /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/ajouter" element={<ProtectedRoute role="owner"><AddProperty /></ProtectedRoute>} />
          <Route path="/modifier/:id" element={<ProtectedRoute role="owner"><EditProperty /></ProtectedRoute>} />

          <Route path="/messages/:requestId" element={<ProtectedRoute role={['tenant', 'owner']}><Conversation /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

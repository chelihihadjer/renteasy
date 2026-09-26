import { useNavigate } from 'react-router';
import PropertyForm from '../components/PropertyForm.jsx';
import { api } from '../services/api.js';

export default function AddProperty() {
  const navigate = useNavigate();

  const create = async (payload) => {
    const { property } = await api.createProperty(payload);
    navigate(`/logement/${property._id}`);
  };

  return (
    <div className="container page narrow">
      <h1>Publier une annonce</h1>
      <p className="muted">Tout ce que vous saisissez ici apparaît sur la fiche publique, sauf vos coordonnées, visibles uniquement par les membres connectés.</p>
      <PropertyForm onSubmit={create} submitLabel="Publier l’annonce" />
    </div>
  );
}

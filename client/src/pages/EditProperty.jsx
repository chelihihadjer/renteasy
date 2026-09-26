import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { EmptyState, Loader } from '../components/Feedback.jsx';
import PropertyForm from '../components/PropertyForm.jsx';
import { api } from '../services/api.js';

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getProperty(id)
      .then(({ property: p, viewer }) => {
        if (!viewer?.isOwner) setError('Vous ne pouvez modifier que vos propres annonces.');
        else setProperty(p);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const save = async (payload) => {
    await api.updateProperty(id, payload);
    navigate(`/logement/${id}`);
  };

  if (error) {
    return (
      <div className="container page">
        <EmptyState title="Modification impossible" action={<Link className="btn btn-dark" to="/dashboard">Retour au tableau de bord</Link>}>
          {error}
        </EmptyState>
      </div>
    );
  }
  if (!property) return <Loader />;

  return (
    <div className="container page narrow">
      <h1>Modifier l’annonce</h1>
      <p className="muted">{property.title}</p>
      <PropertyForm initialValues={property} onSubmit={save} submitLabel="Enregistrer les modifications" />
    </div>
  );
}

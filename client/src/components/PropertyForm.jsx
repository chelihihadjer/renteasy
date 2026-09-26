import { useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { COMMON_AMENITIES, handleImgError, PROPERTY_TYPES, resolveImage } from '../utils/format.js';
import { Alert } from './Feedback.jsx';
import MapView from './MapView.jsx';

const EMPTY = {
  title: '', description: '', price: '', city: '', address: '', type: 'Appartement',
  surface: '', bedrooms: 1, bathrooms: 1, images: [], amenities: [], available: true,
};

function toFormState(initial) {
  const data = { ...EMPTY, ...initial };
  return {
    ...data,
    imagesText: (data.images || []).join('\n'),
    extraAmenities: (data.amenities || []).filter((a) => !COMMON_AMENITIES.includes(a)).join(', '),
    amenities: (data.amenities || []).filter((a) => COMMON_AMENITIES.includes(a)),
    lat: data.location?.coordinates?.[1] ?? '',
    lng: data.location?.coordinates?.[0] ?? '',
  };
}

const splitList = (text) => text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

export default function PropertyForm({ initialValues, onSubmit, submitLabel }) {
  const [form, setForm] = useState(() => toFormState(initialValues));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [initialCenter] = useState(() =>
    form.lat !== '' && form.lng !== '' ? [Number(form.lat), Number(form.lng)] : null
  );
  const fileInput = useRef(null);

  const update = (field) => (event) => {
    const { type, checked, value } = event.target;
    setForm((f) => ({ ...f, [field]: type === 'checkbox' ? checked : value }));
  };

  const toggleAmenity = (amenity) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));

  const images = splitList(form.imagesText);
  const hasPoint = form.lat !== '' && form.lng !== '' && Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lng));
  const picked = useMemo(
    () => (hasPoint ? { lat: Number(form.lat), lng: Number(form.lng) } : null),
    [hasPoint, form.lat, form.lng]
  );

  const setPoint = (lat, lng) =>
    setForm((f) => ({ ...f, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }));

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPoint(pos.coords.latitude, pos.coords.longitude),
      () => setErrors((e) => ({ ...e, location: 'Position refusée ou indisponible' }))
    );
  };

  const handleFiles = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setUploading(true);
    setUploadError('');
    try {
      const { urls } = await api.uploadImages(files);
      setForm((f) => ({ ...f, imagesText: [...splitList(f.imagesText), ...urls].join('\n') }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (url) =>
    setForm((f) => ({ ...f, imagesText: splitList(f.imagesText).filter((u) => u !== url).join('\n') }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Le titre est obligatoire';
    if (!form.description.trim()) e.description = 'La description est obligatoire';
    if (!(Number(form.price) > 0)) e.price = 'Indiquez un loyer supérieur à 0';
    if (!form.city.trim()) e.city = 'La ville est obligatoire';
    if (!form.address.trim()) e.address = "L'adresse est obligatoire";
    if (form.surface !== '' && !(Number(form.surface) > 0)) e.surface = 'Surface invalide';
    if (!Number.isInteger(Number(form.bedrooms)) || Number(form.bedrooms) < 0) e.bedrooms = 'Nombre entier attendu';
    if (!Number.isInteger(Number(form.bathrooms)) || Number(form.bathrooms) < 0) e.bathrooms = 'Nombre entier attendu';
    if (images.some((url) => !/^(https?:\/\/\S+|\/uploads\/[\w.-]+)$/i.test(url))) {
      e.images = 'Chaque ligne doit être une URL commençant par http:// ou https://';
    }
    if ((form.lat === '') !== (form.lng === '')) e.location = 'Renseignez la latitude et la longitude, ou aucune des deux';
    if (images.length > 10) e.images = '10 images maximum';
    return e;
  };

  const submit = async (event) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setError('Corrigez les champs signalés.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      city: form.city.trim(),
      address: form.address.trim(),
      type: form.type,
      surface: form.surface === '' ? null : Number(form.surface),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      images,
      amenities: [...new Set([...form.amenities, ...splitList(form.extraAmenities)])],
      available: form.available,
      lat: form.lat === '' ? null : Number(form.lat),
      lng: form.lng === '' ? null : Number(form.lng),
    };

    setSaving(true);
    setError('');
    try {
      await onSubmit(payload);
    } catch (err) {
      setErrors(err.details || {});
      setError(err.message);
      setSaving(false);
    }
  };

  const fieldError = (name) => errors[name] && <p className="field-error">{errors[name]}</p>;

  return (
    <form className="property-form" onSubmit={submit} noValidate>
      <Alert>{error}</Alert>

      <fieldset>
        <legend>L’annonce</legend>
        <div className="field">
          <label htmlFor="p-title">Titre</label>
          <input id="p-title" maxLength={120} value={form.title} onChange={update('title')} placeholder="F3 lumineux proche du tramway" />
          {fieldError('title')}
        </div>
        <div className="field">
          <label htmlFor="p-description">Description</label>
          <textarea id="p-description" rows="5" maxLength={3000} value={form.description} onChange={update('description')} />
          {fieldError('description')}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="p-type">Type de logement</label>
            <select id="p-type" value={form.type} onChange={update('type')}>
              {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-price">Loyer mensuel (DA)</label>
            <input id="p-price" type="number" min="1" step="500" value={form.price} onChange={update('price')} />
            {fieldError('price')}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Adresse</legend>
        <div className="field-row">
          <div className="field">
            <label htmlFor="p-city">Ville</label>
            <input id="p-city" maxLength={80} value={form.city} onChange={update('city')} />
            {fieldError('city')}
          </div>
          <div className="field">
            <label htmlFor="p-address">Adresse</label>
            <input id="p-address" maxLength={200} value={form.address} onChange={update('address')} />
            {fieldError('address')}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Caractéristiques</legend>
        <div className="field-row field-row-3">
          <div className="field">
            <label htmlFor="p-surface">Surface (m²)</label>
            <input id="p-surface" type="number" min="1" value={form.surface} onChange={update('surface')} />
            {fieldError('surface')}
          </div>
          <div className="field">
            <label htmlFor="p-bedrooms">Chambres</label>
            <input id="p-bedrooms" type="number" min="0" step="1" value={form.bedrooms} onChange={update('bedrooms')} />
            {fieldError('bedrooms')}
          </div>
          <div className="field">
            <label htmlFor="p-bathrooms">Salles de bain</label>
            <input id="p-bathrooms" type="number" min="0" step="1" value={form.bathrooms} onChange={update('bathrooms')} />
            {fieldError('bathrooms')}
          </div>
        </div>

        <div className="field">
          <span className="label">Équipements</span>
          <div className="chips">
            {COMMON_AMENITIES.map((a) => (
              <label key={a} className={`chip-toggle ${form.amenities.includes(a) ? 'is-on' : ''}`}>
                <input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                {a}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="p-extra">Autres équipements, séparés par des virgules</label>
          <input id="p-extra" value={form.extraAmenities} onChange={update('extraAmenities')} placeholder="Cuisine équipée, Double vitrage" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Localisation</legend>
        <p className="muted small">
          Cliquez sur la carte pour placer le logement. Les visiteurs ne voient qu’une zone approximative
          d’environ 300 m, jamais le point exact.
        </p>
        <MapView
          center={initialCenter}
          zoom={15}
          picked={picked}
          onPick={setPoint}
          fit={false}
          height={300}
          label="Carte de localisation du logement"
        />
        <div className="field-row field-row-actions">
          <div className="field">
            <label htmlFor="p-lat">Latitude</label>
            <input id="p-lat" type="number" step="any" value={form.lat} onChange={update('lat')} />
          </div>
          <div className="field">
            <label htmlFor="p-lng">Longitude</label>
            <input id="p-lng" type="number" step="any" value={form.lng} onChange={update('lng')} />
          </div>
          <div className="field-buttons">
            <button type="button" className="btn btn-ghost btn-sm" onClick={locateMe}>Utiliser ma position</button>
            {hasPoint && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, lat: '', lng: '' }))}>
                Retirer le point
              </button>
            )}
          </div>
        </div>
        {fieldError('location')}
      </fieldset>

      <fieldset>
        <legend>Photos</legend>
        <div className="upload-row">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFiles}
          />
          <button type="button" className="btn btn-dark" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? 'Envoi des photos…' : 'Importer des photos'}
          </button>
          <span className="muted small">JPEG, PNG ou WebP, 5 Mo maximum, 6 par envoi.</span>
        </div>
        <Alert>{uploadError}</Alert>
        {images.length > 0 && (
          <ul className="image-preview">
            {images.slice(0, 10).map((url, i) => (
              <li key={url}>
                <img src={resolveImage(url)} alt="" onError={handleImgError} />
                {i === 0 && <span className="cover-flag">Couverture</span>}
                <button type="button" className="image-remove" aria-label={`Retirer la photo ${i + 1}`} onClick={() => removeImage(url)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="field">
          <label htmlFor="p-images">Ou collez des adresses d’images, une par ligne (la première sert de couverture)</label>
          <textarea id="p-images" rows="3" value={form.imagesText} onChange={update('imagesText')} placeholder="https://…" />
          {fieldError('images')}
        </div>
      </fieldset>

      <label className="switch">
        <input type="checkbox" checked={form.available} onChange={update('available')} />
        <span>Logement disponible à la location</span>
      </label>

      <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
        {saving ? 'Enregistrement…' : submitLabel}
      </button>
    </form>
  );
}

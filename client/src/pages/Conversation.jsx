import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, EmptyState, Loader } from '../components/Feedback.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatDate, formatTime, handleImgError, plural, resolveImage } from '../utils/format.js';

export default function Conversation() {
  const { requestId } = useParams();
  const { user, isOwner } = useAuth();
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(
    () => api.thread(requestId).then(setThread).catch((err) => setError(err.message)),
    [requestId]
  );

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const count = thread?.items.length || 0;
    if (count !== lastCount.current) {
      bottom.current?.scrollIntoView({ block: 'end' });
      lastCount.current = count;
    }
  }, [thread]);

  const send = async (event) => {
    event?.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError('');
    try {
      await api.sendMessage(requestId, body);
      setText('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) send(event);
  };

  if (error && !thread) {
    return (
      <div className="container page">
        <EmptyState title="Conversation indisponible" action={<Link className="btn btn-dark" to="/">Retour</Link>}>
          {error}
        </EmptyState>
      </div>
    );
  }
  if (!thread) return <Loader />;

  const { request, other, items } = thread;
  const closed = request.status === 'rejected';
  const backTo = isOwner ? '/dashboard' : '/mes-demandes';

  return (
    <div className="container page narrow conversation">
      <Link to={backTo} className="back-link">{isOwner ? 'Retour au tableau de bord' : 'Retour à mes demandes'}</Link>

      <header className="conversation-head">
        {request.property && (
          <img src={resolveImage(request.property.images?.[0])} alt="" onError={handleImgError} />
        )}
        <div>
          <h1>{other?.firstName} {other?.lastName}</h1>
          <p className="muted">
            {request.property ? (
              <Link to={`/logement/${request.property._id}`}>{request.property.title}</Link>
            ) : 'Annonce supprimée'}
          </p>
          <p className="muted small">Entrée le {formatDate(request.startDate)}, pour {plural(request.duration, 'mois', 'mois')}.</p>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <div className="messages" aria-live="polite">
        {items.length === 0 && (
          <p className="muted messages-empty">Aucun message pour l’instant. Posez vos questions sur la visite ou les conditions.</p>
        )}
        {items.map((m) => {
          const mine = m.sender === user._id;
          return (
            <div key={m._id} className={`bubble ${mine ? 'is-mine' : ''}`}>
              <p>{m.body}</p>
              <span className="bubble-meta">
                {formatTime(m.createdAt)}
                {mine && m.readAt ? ', lu' : ''}
              </span>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <Alert>{error}</Alert>

      {closed ? (
        <p className="muted">Cette demande a été refusée, la conversation est fermée.</p>
      ) : (
        <form className="composer" onSubmit={send}>
          <label htmlFor="composer" className="sr-only">Votre message</label>
          <textarea
            id="composer"
            rows="2"
            maxLength={2000}
            placeholder="Écrivez votre message. Entrée pour envoyer, Maj + Entrée pour aller à la ligne."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      )}
    </div>
  );
}

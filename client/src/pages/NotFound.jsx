import { Link } from 'react-router';
import { EmptyState } from '../components/Feedback.jsx';

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState title="Cette page n’existe pas" action={<Link className="btn btn-primary" to="/">Voir les logements</Link>}>
        Le lien est peut-être incomplet ou l’annonce a été retirée.
      </EmptyState>
    </div>
  );
}

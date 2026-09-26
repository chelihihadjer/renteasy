export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Page précédente
      </button>
      <span>Page {page} sur {pages}</span>
      <button type="button" className="btn btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Page suivante
      </button>
    </nav>
  );
}

import { useEffect, useState } from 'react';

export default function SearchBar({ value = '', onSearch }) {
  const [text, setText] = useState(value);
  useEffect(() => {
  setText(value);
}, [value]);

  const submit = (event) => {
    event.preventDefault();
    onSearch(text.trim());
  };

  return (
    <form className="searchbar" role="search" onSubmit={submit}>
      <label htmlFor="search" className="sr-only">Ville ou titre de l’annonce</label>
      <input
        id="search"
        type="search"
        placeholder="Ville ou titre, par exemple Constantine"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={60}
      />
      <button type="submit" className="btn btn-primary">Rechercher</button>
    </form>
  );
}

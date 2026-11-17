import { Link } from 'react-router-dom';

export const NotFound = () => (
  <main className="notfound">
    <h1>Page not found</h1>
    <p>
      Play at <code>/room/player</code> or go back to the <Link to="/">home page</Link>.
    </p>
  </main>
);

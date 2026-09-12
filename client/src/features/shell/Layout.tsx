import { Link, Outlet } from 'react-router-dom';
export function Layout() {
  return (
    <>
      <header className="border-b border-line p-6">
        <Link to="/en">SolCacao · repository template</Link>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </>
  );
}

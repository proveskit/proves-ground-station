import { NavLink, Outlet } from 'react-router-dom';

export default function Navbar() {
  const LINKS: { name: string; href: string }[] = [
    { name: 'Logs', href: '/' },
    { name: 'Commands', href: '/commands' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div>
      <div className="w-full h-14 bg-blue-600 px-6 flex items-center justify-between text-white">
        <div className="flex gap-4 items-center">
          {LINKS.map((link, idx) => (
            <NavLink to={link.href} key={idx}>
              {link.name}
            </NavLink>
          ))}
        </div>
        <div>connect button</div>
      </div>
      <Outlet />
    </div>
  );
}

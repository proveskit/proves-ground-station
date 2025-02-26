import { useContext, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ConnectionContext,
  ConnectionState,
} from '../context/ConnectionContext';

const LINKS: { name: string; href: string }[] = [
  { name: 'Logs', href: '/' },
  { name: 'Commands', href: '/commands' },
  { name: 'Files', href: '/files' },
  { name: 'Settings', href: '/settings' },
];

export default function Navbar() {
  const connectionContext = useContext(ConnectionContext)!;

  const [usbDevices, setUsbDevices] = useState<string[]>([]);
  const [activeDevice, setActiveDevice] = useState<string>('');

  useEffect(() => {
    // run calls to get initial data
    window.electron.ipcRenderer.sendMessage('get-usb-devices');
    window.electron.ipcRenderer.sendMessage('check-connected');

    window.electron.ipcRenderer.once('get-usb-devices', (data: string) => {
      const d = data.split('\n').filter((d) => d !== '');
      setUsbDevices(d);
      setActiveDevice(d[0]);
    });

    window.electron.ipcRenderer.once(
      'check-connected',
      (data: ConnectionState) => {
        connectionContext.setState(data);
      },
    );
  }, []);

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
        <div>
          <div className="flex gap-3 items-center">
            <select
              value={activeDevice}
              className="border-2 h-8 rounded-sm border-neutral-400"
            >
              {usbDevices.map((device, idx) => (
                <option onClick={() => setActiveDevice(device)} key={idx}>
                  {device}
                </option>
              ))}
            </select>
            {!connectionContext.data.connected ? (
              <button
                className="bg-white text-black px-3 py-2 rounded-md hover:cursor-pointer"
                onClick={() => {
                  window.electron.ipcRenderer.sendMessage(
                    'connect-device',
                    activeDevice,
                  );
                  connectionContext.setState({
                    connected: true,
                    deviceName: activeDevice,
                    connectedAt: Date.now(),
                  });
                }}
              >
                Connect
              </button>
            ) : (
              <button
                className="bg-red-500 text-white px-3 py-2 rounded-md hover:cursor-pointer"
                onClick={() => {
                  window.electron.ipcRenderer.sendMessage('disconnect-device');
                  connectionContext.setState({ connected: false });
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaBug, FaCheck, FaInfoCircle } from 'react-icons/fa';
import { IoWarning } from 'react-icons/io5';
import { MdError, MdErrorOutline } from 'react-icons/md';
import { z } from 'zod';

function Home() {
  const [connected, setConnected] = useState<boolean>(false);
  const [usbDevices, setUsbDevices] = useState<string[]>([]);
  const [activeDevice, setActiveDevice] = useState<string>('');

  const [msgs, setMsgs] = useState<string[]>([]);
  const [cmdInput, setCmdInput] = useState('');

  useEffect(() => {
    window.electron.ipcRenderer.on('terminal-data', (data) => {
      setMsgs((prev) => [data as string, ...prev]);
    });

    window.electron.ipcRenderer.sendMessage('get-usb-devices');
    window.electron.ipcRenderer.sendMessage('check-connected');

    window.electron.ipcRenderer.once('send-usb-devices', (data: string) => {
      const d = data.split('\n').filter((d) => d !== '');
      setUsbDevices(d);
      setActiveDevice(d[0]);
    });

    window.electron.ipcRenderer.once('check-connected', (data: boolean) => {
      setConnected(data);
    });
  }, []);

  return (
    <div className="w-screen p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-2xl mb-3">Satellite Controller</p>
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
          {!connected ? (
            <button
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:cursor-pointer"
              onClick={() => {
                window.electron.ipcRenderer.sendMessage(
                  'connect-device',
                  activeDevice,
                );
                setConnected(true);
              }}
            >
              Connect
            </button>
          ) : (
            <button
              className="bg-red-500 text-white px-3 py-2 rounded-md hover:cursor-pointer"
              onClick={() => {
                window.electron.ipcRenderer.sendMessage('disconnect-device');
                setConnected(false);
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
      <div className="w-full gap-3 h-200 overflow-scroll bg-neutral-100 flex flex-col-reverse rounded-md shadow-sm p-2">
        {msgs.map((msg, idx) => {
          try {
            const validatedLog = LogSchema.parse(JSON.parse(msg));
            return <FormattedLog log={validatedLog} key={idx} />;
          } catch (e) {
            return <p>{msg}</p>;
          }
        })}
      </div>
      <div className="flex h-12 items-center gap-2">
        <input
          type="text"
          onChange={(evt) => setCmdInput(evt.target.value)}
          className="border-2 h-10 rounded-md border-neutral-600"
        />
        <button
          className="bg-green-600 text-white px-3 py-2 rounded-md hover:cursor-pointer"
          onClick={() => {
            window.electron.ipcRenderer.sendMessage('send-command', cmdInput);
          }}
        >
          Send Command
        </button>
        <button
          className="bg-green-600 text-white px-3 py-2 rounded-md hover:cursor-pointer"
          onClick={() => {
            window.electron.ipcRenderer.sendMessage('enter-repl');
          }}
        >
          Enter REPL
        </button>
        <button
          className="bg-red-600 text-white px-3 py-2 rounded-md hover:cursor-pointer"
          onClick={() => {
            window.electron.ipcRenderer.sendMessage('exit-repl');
          }}
        >
          Exit REPL
        </button>
      </div>
    </div>
  );
}

const LogSchema = z
  .object({
    msg: z.string(),
    time: z.string(),
    level: z.enum(['NOTSET', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  })
  .catchall(z.any());

type Log = z.infer<typeof LogSchema>;

const omit = (obj, arr) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !arr.includes(k)));

const LOG_ICONS: { [key: string]: any } = {
  NOTSET: FaCheck,
  DEBUG: FaBug,
  INFO: FaInfoCircle,
  WARNING: IoWarning,
  ERROR: MdErrorOutline,
  CRITICAL: MdError,
};

const BG_COLORS: { [key: string]: string } = {
  NOTSET: 'bg-neutral-200',
  INFO: 'bg-neutral-200',
  DEBUG: 'bg-blue-200',
  WARNING: 'bg-yellow-200',
  ERROR: 'bg-red-300',
  CRITICAL: 'bg-red-500',
};

function FormattedLog({ log }: { log: Log }) {
  const LogIcon = LOG_ICONS[log.level];
  return (
    <div
      className={`w-full h-14 ${BG_COLORS[log.level]} justify-between rounded-md shadow-md flex gap-2 items-center px-4`}
    >
      <div className="flex items-center gap-2">
        <LogIcon size={24} />
        <p>{log.msg}</p>
        <div className="bg-neutral-400">
          {Object.entries(omit(log, ['msg', 'time', 'level'])).map(([k, v]) => (
            <p key={k}>{`${k}: ${v}`}</p>
          ))}
        </div>
      </div>
      <p className="text-neutral-600 text-sm">{log.time}</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

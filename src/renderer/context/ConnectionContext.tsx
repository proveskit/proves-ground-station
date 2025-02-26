import { createContext, SetStateAction, useState } from 'react';

export type ConnectionState =
  | ConnectedConnectionState
  | DisconnectedConnectionState;

type ConnectedConnectionState = {
  connected: true;
  deviceName: string;
  connectedAt: number;
};

type DisconnectedConnectionState = {
  connected: false;
};

export function ConnectionContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConnectionState>({ connected: false });
  return (
    <ConnectionContext.Provider value={{ setState: setState, data: state }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export const ConnectionContext = createContext<{
  setState: React.Dispatch<SetStateAction<ConnectionState>>;
  data: ConnectionState;
} | null>(null);

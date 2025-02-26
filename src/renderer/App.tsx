import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Navbar from './components/Navbar';
import Commands from './routes/Commands';
import Settings from './routes/Settings';
import { ConnectionContextProvider } from './context/ConnectionContext';

export default function App() {
  return (
    <Router>
      <ConnectionContextProvider>
        <Routes>
          <Route element={<Navbar />}>
            <Route index path="/" element={<Home />} />
            <Route path="/commands" element={<Commands />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </ConnectionContextProvider>
    </Router>
  );
}

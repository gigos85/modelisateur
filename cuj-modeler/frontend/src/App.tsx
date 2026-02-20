import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';

const App = () => (
  <Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/editor/:id" element={<EditorPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;

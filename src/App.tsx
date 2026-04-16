import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Main from './pages/App/Main';
import TestSupabase from './pages/TestSupabase';
import DatabaseDebug from './pages/DatabaseDebug';
import AuthGuard from './components/AuthGuard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot" element={<ForgotPassword />} />
          <Route path="/test-supabase" element={<TestSupabase />} />
          <Route path="/database-debug" element={<AuthGuard><DatabaseDebug /></AuthGuard>} />
          <Route path="/app" element={<AuthGuard><Main /></AuthGuard>} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
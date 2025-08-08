import { AuthProvider } from './contexts/AuthContext';
import AuthComponent from './components/AuthComponent';
import AppLayout from './components/AppLayout';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthComponent />;
  }

  return <AppLayout />;
}

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;

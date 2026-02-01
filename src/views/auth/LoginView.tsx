import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../core/components/Button.tsx';
import { Input } from '../../core/components/Input.tsx';
import { Card } from '../../core/components/Card.tsx';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#dbdbdb] rounded-lg mx-auto flex items-center justify-center mb-4">
            <span className="text-gray-700 text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HyperPC Dashboard</h1>
          <p className="text-gray-600 mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hyperpc.cl"
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Credenciales de demo:<br />
              admin@hyperpc.cl / admin123<br />
              user@hyperpc.cl / user123
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginView;

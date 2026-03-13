import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../core/components/Button.tsx';
import { Input } from '../../core/components/Input.tsx';
import { Card } from '../../core/components/Card.tsx';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#f4f1ea,_#f8fafc_42%,_#eef2f7)] px-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-[#dbdbdb] rounded-lg mx-auto flex items-center justify-center mb-4">
              <span className="text-gray-700 text-2xl font-bold">H</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">HyperPC</h1>
          </div>

          <Card className="border border-gray-200/80 bg-white/95 shadow-xl shadow-gray-300/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">Acceso</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">Iniciar sesión</h2>
              </div>

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

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Iniciar Sesión
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

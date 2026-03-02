'use client';

import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Acceso restringido</h1>
        <p className="text-gray-600 mb-8">
          No tienes permisos para acceder al dashboard. Contacta al administrador.
        </p>
        <button
          onClick={handleSignOut}
          className="text-sm text-blue-600 hover:underline"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}

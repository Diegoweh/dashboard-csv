import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Acceso restringido</h1>
        <p className="text-gray-600 mb-8">
          No tienes permisos para acceder al dashboard. Contacta al administrador.
        </p>
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}

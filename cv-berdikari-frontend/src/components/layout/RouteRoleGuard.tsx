import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface RouteRoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RouteRoleGuard({
  allowedRoles,
  children,
}: RouteRoleGuardProps) {
  const { role } = useUserRole();

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

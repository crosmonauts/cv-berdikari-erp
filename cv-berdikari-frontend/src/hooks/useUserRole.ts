export function useUserRole() {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return {
      role: null as string | null,
      isSuperadmin: false,
      isAdmin: false,
      isGudang: false,
      isEkspedisi: false,
      canManage: false,
      canAccessMasterData: false,
      canManageUsers: false,
    };
  }

  let role = '';
  try {
    role = JSON.parse(storedUser).role;
  } catch {
    return {
      role: null as string | null,
      isSuperadmin: false,
      isAdmin: false,
      isGudang: false,
      isEkspedisi: false,
      canManage: false,
      canAccessMasterData: false,
      canManageUsers: false,
    };
  }

  return {
    role,
    isSuperadmin: role === 'SUPERADMIN',
    isAdmin: role === 'ADMIN',
    isGudang: role === 'GUDANG',
    isEkspedisi: role === 'EKSPEDISI',
    canManage: ['SUPERADMIN', 'ADMIN'].includes(role),
    canAccessMasterData: ['SUPERADMIN', 'ADMIN'].includes(role),
    canManageUsers: role === 'SUPERADMIN',
  };
}

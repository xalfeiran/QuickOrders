// Shared business-scope state for dashboard screens — the mobile counterpart
// of frontend/src/admin/useAdminBusiness.js. Superadmins get the list of
// businesses and a selectable slug; business_admins are pinned to their own
// and never see the picker.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useBusinessScope() {
  const { user } = useAuth();
  const isSuper = user?.role === 'superadmin';
  const [businesses, setBusinesses] = useState([]);
  const [slug, setSlug] = useState(isSuper ? '' : user?.businessSlug);

  useEffect(() => {
    if (!isSuper) return;
    api.adminBusinesses().then((list) => {
      setBusinesses(list);
      if (list.length > 0) setSlug((current) => current || list[0].slug);
    });
  }, [isSuper]);

  return { isSuper, businesses, slug, setSlug };
}

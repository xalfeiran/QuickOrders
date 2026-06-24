import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAdminAuth } from './AdminAuthContext.jsx';

// Shared business-scope state for dashboard pages: superadmins get the list of
// businesses and a selectable slug; business_admins are pinned to their own.
export function useAdminBusiness() {
  const { user } = useAdminAuth();
  const isSuper = user.role === 'superadmin';
  const [businesses, setBusinesses] = useState([]);
  const [slug, setSlug] = useState(isSuper ? '' : user.businessSlug);

  useEffect(() => {
    if (!isSuper) return;
    api.adminBusinesses().then((list) => {
      setBusinesses(list);
      if (list.length > 0) setSlug((s) => s || list[0].slug);
    });
  }, [isSuper]);

  return { isSuper, businesses, slug, setSlug };
}

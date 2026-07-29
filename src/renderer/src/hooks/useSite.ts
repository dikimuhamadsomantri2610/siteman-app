import { useState, useEffect } from 'react';
import { getStoredSite, setStoredSite, SiteInfo } from '@/components/SiteModal';

export function useSite() {
  const [site, setSiteState] = useState<SiteInfo>(() => getStoredSite());

  useEffect(() => {
    const handleSiteChanged = () => {
      setSiteState(getStoredSite());
    };
    window.addEventListener('site_changed', handleSiteChanged);
    return () => {
      window.removeEventListener('site_changed', handleSiteChanged);
    };
  }, []);

  const updateSite = (newSite: SiteInfo) => {
    setStoredSite(newSite);
    setSiteState(newSite);
  };

  const openSiteModal = () => {
    window.dispatchEvent(new Event('open_site_modal'));
  };

  return {
    site,
    updateSite,
    openSiteModal,
    isSiteComplete: Boolean(site.siteToko && site.dcPengirim),
  };
}

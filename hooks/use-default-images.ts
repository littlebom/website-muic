import { useState, useEffect } from 'react';
import { WebAppSettings } from '@/lib/types';

interface DefaultImages {
  defaultCourseThumbnail: string | null;
  defaultInstitutionLogo: string | null;
  defaultNewsImage: string | null;
}

export function useDefaultImages() {
  const [defaultImages, setDefaultImages] = useState<DefaultImages>({
    defaultCourseThumbnail: null,
    defaultInstitutionLogo: null,
    defaultNewsImage: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          if (settings) {
            setDefaultImages({
              defaultCourseThumbnail: settings.defaultCourseThumbnail || null,
              defaultInstitutionLogo: settings.defaultInstitutionLogo || null,
              defaultNewsImage: settings.defaultNewsImage || null,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch default images:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { defaultImages, loading };
}

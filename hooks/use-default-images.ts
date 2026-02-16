import { useSettings } from '@/components/providers/settings-provider';

interface DefaultImages {
  defaultCourseThumbnail: string | null;
  defaultInstitutionLogo: string | null;
  defaultNewsImage: string | null;
}

export function useDefaultImages() {
  const { settings, loading } = useSettings();

  const defaultImages: DefaultImages = {
    defaultCourseThumbnail: settings?.defaultCourseThumbnail || null,
    defaultInstitutionLogo: settings?.defaultInstitutionLogo || null,
    defaultNewsImage: settings?.defaultNewsImage || null,
  };

  return { defaultImages, loading };
}

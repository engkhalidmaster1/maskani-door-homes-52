import { useSettings } from '@/hooks/useSettings';
import { FOOTER_DEFAULT_HEADING, FOOTER_DEFAULT_SUBTEXT } from '@/lib/menuLabels';

export const Footer = () => {
  const { settings } = useSettings() ?? { settings: null };
  const cfg = (settings ?? {}) as Record<string, unknown>;
  const heading = String(cfg['footer_heading'] ?? FOOTER_DEFAULT_HEADING);
  const subtext = String(cfg['footer_subtext'] ?? FOOTER_DEFAULT_SUBTEXT);

  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-12 text-center">
        <h3 className="text-2xl font-bold mb-4 text-card-foreground">{heading}</h3>
        <p className="text-sm text-muted-foreground">{subtext} &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

/**
 * Utility to centralize ad ribbon (boost/turbo) labels, colors and priority.
 * Maps the internal plan names (premium, pro, max) to the user-facing labels and styles.
 */

export interface BoostRibbonConfig {
  label: string;
  color: string;
  gradient: string;
  priority: number;
}

const RIBBON_CONFIGS: Record<string, BoostRibbonConfig> = {
  max: {
    label: "DESTAQUE MAX",
    color: "#EAB308", // Golden/Yellow-600
    gradient: "from-yellow-400 via-yellow-500 to-amber-500",
    priority: 3
  },
  pro: {
    label: "DESTAQUE PRO",
    color: "#06B6D4", // Cyan-500
    gradient: "from-cyan-400 to-blue-500",
    priority: 2
  },
  premium: {
    label: "DESTAQUE",
    color: "#64748B", // Slate-500
    gradient: "from-slate-400 to-slate-500",
    priority: 1
  }
};

const DEFAULT_CONFIG: BoostRibbonConfig = {
  label: "DESTAQUE",
  color: "#64748B",
  gradient: "from-slate-400 to-slate-500",
  priority: 0
};

/**
 * Returns the configuration for a given boost plan name.
 * Handles both new turbo plan names and case-insensitive matching.
 */
export const getBoostRibbon = (planName?: string | null): BoostRibbonConfig | null => {
  if (!planName || planName.toLowerCase() === 'gratis' || planName.toLowerCase() === 'free') {
    return null;
  }

  const normalized = planName.toLowerCase();
  
  // Direct mapping for new plans
  if (RIBBON_CONFIGS[normalized]) {
    return RIBBON_CONFIGS[normalized];
  }

  // Fallback/Legacy Mapping (if needed during transition)
  if (normalized === 'topo') return RIBBON_CONFIGS.pro;
  if (normalized === 'premium' && !RIBBON_CONFIGS[normalized]) return RIBBON_CONFIGS.premium; // Safety
  if (normalized === 'simples') return RIBBON_CONFIGS.premium;

  return DEFAULT_CONFIG;
};

/**
 * Helper to get only the priority for sorting purposes.
 */
export const getBoostPriority = (planName?: string | null): number => {
  const config = getBoostRibbon(planName);
  return config ? config.priority : 0;
};
/**
 * Helper to get the Tailwind border classes for a given boost plan.
 */
export const getBoostBorderClass = (planName?: string | null, isActive: boolean = true): string => {
  if (!isActive) return 'border-gray-100';
  
  const ribbon = getBoostRibbon(planName);
  if (!ribbon) return 'border-gray-100';

  const normalized = planName?.toLowerCase() || '';
  if (normalized === 'max') return 'border-yellow-400 ring-1 ring-yellow-400/30';
  if (normalized === 'pro') return 'border-cyan-400 ring-1 ring-cyan-400/30';
  if (normalized === 'premium') return 'border-gray-200';

  return 'border-gray-200';
};

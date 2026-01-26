/**
 * Background Depth Layer
 * Renders soft gradient orbs that drift slowly, creating depth for glass effects
 * Respects prefers-reduced-motion for accessibility
 */

interface BackgroundOrbsProps {
  isDark: boolean;
}

export function BackgroundOrbs({ isDark }: BackgroundOrbsProps) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Primary orb - ember tinted, top right area */}
      <div
        className={`
          absolute w-[500px] h-[500px] rounded-full
          orb-drift-1
          ${isDark
            ? 'bg-gradient-radial from-ember-500/20 via-ember-500/5 to-transparent'
            : 'bg-gradient-radial from-ember-500/15 via-ember-500/5 to-transparent'
          }
        `}
        style={{
          top: '-10%',
          right: '-5%',
          filter: 'blur(60px)',
        }}
      />

      {/* Secondary orb - cooler tone, bottom left */}
      <div
        className={`
          absolute w-[400px] h-[400px] rounded-full
          orb-drift-2
          ${isDark
            ? 'bg-gradient-radial from-void-500/30 via-void-600/10 to-transparent'
            : 'bg-gradient-radial from-void-300/20 via-void-200/5 to-transparent'
          }
        `}
        style={{
          bottom: '10%',
          left: '-10%',
          filter: 'blur(50px)',
        }}
      />

      {/* Tertiary orb - subtle ember, center-ish */}
      <div
        className={`
          absolute w-[300px] h-[300px] rounded-full
          orb-drift-3
          ${isDark
            ? 'bg-gradient-radial from-ember-600/10 via-transparent to-transparent'
            : 'bg-gradient-radial from-ember-400/10 via-transparent to-transparent'
          }
        `}
        style={{
          top: '40%',
          right: '20%',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

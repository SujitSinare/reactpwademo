import React from 'react';

interface UnityLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'mark';
  theme?: 'dark' | 'light' | 'yellow' | 'brand';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const UnityLogo: React.FC<UnityLogoProps> = ({
  className = '',
  variant = 'full',
  theme = 'brand',
  size = 'md',
}) => {
  // Color tokens based on theme
  const getColors = () => {
    switch (theme) {
      case 'yellow':
        return {
          emblem: '#121212',
          text: '#121212',
          subtext: '#262626',
          bg: '#FCB913',
        };
      case 'light':
        return {
          emblem: '#121212',
          text: '#121212',
          subtext: '#4B5563',
          bg: 'transparent',
        };
      case 'dark':
        return {
          emblem: '#FCB913',
          text: '#FFFFFF',
          subtext: '#9CA3AF',
          bg: 'transparent',
        };
      case 'brand':
      default:
        return {
          emblem: '#FCB913',
          text: '#121212',
          subtext: '#4A4A4A',
          bg: 'transparent',
        };
    }
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Unity Interlocking Woven U Symbol */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} aspect-square flex-shrink-0 transition-transform`}
      >
        {/* Background rounded squircle if desired or transparent */}
        {/* Weave geometry matching Unity Bank Mark */}
        <g fill={colors.emblem}>
          {/* Top horizontal crossbar */}
          <rect x="8" y="28" width="84" height="13" rx="2" />
          {/* Bottom horizontal crossbar */}
          <rect x="8" y="55" width="84" height="13" rx="2" />
          
          {/* Left vertical pillar */}
          <rect x="25" y="10" width="13" height="58" rx="2" />
          {/* Right vertical pillar */}
          <rect x="62" y="10" width="13" height="58" rx="2" />

          {/* Bottom connecting curve / U-loop base */}
          <path
            d="M 25 60 L 25 76 C 25 86, 33 92, 50 92 C 67 92, 75 86, 75 76 L 75 60 L 62 60 L 62 75 C 62 79, 58 81, 50 81 C 42 81, 38 79, 38 75 L 38 60 Z"
          />

          {/* Notch / weave cutout effect for high realism */}
          <rect x="22" y="38" width="6" height="5" fill={colors.bg === 'transparent' ? '#000000' : colors.bg} fillOpacity={colors.bg === 'transparent' ? 0.15 : 1} rx="1" />
          <rect x="72" y="38" width="6" height="5" fill={colors.bg === 'transparent' ? '#000000' : colors.bg} fillOpacity={colors.bg === 'transparent' ? 0.15 : 1} rx="1" />
        </g>
      </svg>

      {/* Typography Wordmark */}
      {variant !== 'mark' && (
        <div className="flex items-center gap-2.5">
          {/* Bold Geometric UNITY */}
          <div className="flex flex-col">
            <span
              className="font-black tracking-tight leading-none text-2xl uppercase"
              style={{
                color: colors.text,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              UNITY
            </span>
          </div>

          {/* Divider */}
          <div
            className="w-[1.5px] h-8 self-center"
            style={{ backgroundColor: colors.emblem }}
          />

          {/* Subtitle: Small Finance Bank */}
          <div
            className="flex flex-col text-[10px] sm:text-[11px] leading-[1.15] font-serif font-medium tracking-tight"
            style={{ color: colors.subtext }}
          >
            <span>Small</span>
            <span>Finance</span>
            <span>Bank</span>
          </div>
        </div>
      )}
    </div>
  );
};

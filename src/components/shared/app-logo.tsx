import type { SVGProps } from 'react';

const LogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-primary"
    {...props}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);


export function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <LogoIcon />
      <h1 className="text-2xl font-bold text-primary">SwitchLink Payments</h1>
    </div>
  );
}

// Placeholder for M-PESA Logo SVG
// In a real app, use the official M-PESA logo SVG
const MpesaLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 120 40" // Adjusted viewBox for better text fit
    xmlns="http://www.w3.org/2000/svg"
    aria-label="M-PESA Logo"
  >
    <rect width="120" height="40" rx="5" ry="5" fill="#4CAF50" /> {/* Green background like M-PESA */}
    <text x="60" y="26" fontSize="18" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">
      M-PESA
    </text>
  </svg>
);
export default MpesaLogo;

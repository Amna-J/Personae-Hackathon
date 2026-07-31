const Button = ({
  children,
  onClick,
  showArrow = false,
  arrowIcon = null,
  iconPosition = "right",
  fullWidth = false,
  type = "button",
  ariaLabel,
  className = "",
  variant = "primary",
}) => {
  const base =
    "btn group font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none";

  const styles =
    variant === "secondary-earthen"
      ? "border border-cream text-cream bg-transparent hover:bg-cream/8"
      : variant === "secondary"
      ? "border border-sage text-sage-deep bg-transparent hover:bg-sage/8"
      : "bg-terracotta text-espresso hover:bg-terracotta-deep disabled:opacity-40";

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        ${base} ${styles}
        ${fullWidth ? "w-full" : "md:w-auto"}
        ${className}
      `}
    >
      <span className="flex items-center gap-2">
        {iconPosition === "left" && arrowIcon}
        {children}
        {iconPosition === "right" && arrowIcon}
        {showArrow && !arrowIcon && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        )}
      </span>
    </button>
  );
};

export default Button;

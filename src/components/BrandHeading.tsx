export function BrandHeading({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={className ? `brand-lockup ${className}` : 'brand-lockup'}>
      <span className="brand-mark" aria-hidden="true">
        <img src="/freyLogo.svg" alt="" className="w-full h-full block object-contain" />
      </span>
      <h1>{text}</h1>
    </div>
  );
}
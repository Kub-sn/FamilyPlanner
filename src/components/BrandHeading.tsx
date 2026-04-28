export function BrandHeading({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={className ? `flex items-center gap-[0.85rem] [&>h1]:m-0 ${className}` : 'flex items-center gap-[0.85rem] [&>h1]:m-0'}>
      <span className="brand-mark" aria-hidden="true">
        <img src="/freyLogo.svg" alt="" className="w-full h-full block object-contain" />
      </span>
      <h1>{text}</h1>
    </div>
  );
}
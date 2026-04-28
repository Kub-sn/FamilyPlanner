export function FieldError({ message, fieldName }: { message?: string; fieldName: string }) {
  if (!message) return null;
  return (
    <p
      id={`${fieldName}-error`}
      role="alert"
      className="m-0 -mt-1 text-[0.82rem] font-medium text-[#c44a4f]"
    >
      {message}
    </p>
  );
}

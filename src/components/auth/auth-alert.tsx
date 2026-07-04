type AuthAlertProps = {
  variant: "error" | "success" | "info";
  children: React.ReactNode;
};

const styles = {
  error: "border-rose-200 bg-rose-50 text-rose-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-indigo-200 bg-indigo-50 text-indigo-900",
};

export function AuthAlert({ variant, children }: AuthAlertProps) {
  return (
    <p
      className={`rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${styles[variant]}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

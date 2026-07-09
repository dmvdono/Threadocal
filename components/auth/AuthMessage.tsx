type AuthMessageProps = {
  message: string | null;
  tone?: "error" | "success";
};

export function AuthMessage({ message, tone = "error" }: AuthMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={`auth-message ${tone}`} role={tone === "error" ? "alert" : "status"}>
      {message}
    </p>
  );
}

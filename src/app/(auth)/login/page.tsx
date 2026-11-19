import { PublicRoute } from "@/features/auth/components/auth-gate";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginForm />
    </PublicRoute>
  );
}

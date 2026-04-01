"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { AppInput, LoginCard } from "@/components/ui/login-1";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Μη έγκυρη διεύθυνση email"),
  password: z.string().min(1, "Απαιτείται κωδικός πρόσβασης"),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      remember: String(data.remember ?? false),
      redirect: false,
    });

    if (result?.error) {
      setError("Λάθος email ή κωδικός πρόσβασης");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <LoginCard
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      error={error}
      emailField={
        <AppInput
          label="Διεύθυνση Email"
          placeholder="admin@repairtrack.local"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
      }
      passwordField={
        <AppInput
          label="Κωδικός Πρόσβασης"
          placeholder="••••••••"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          error={errors.password?.message}
          icon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register("password")}
        />
      }
    >
      {/* Remember me */}
      <div className="flex items-center gap-2 -mt-2">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-primary cursor-pointer"
          {...register("remember")}
        />
        <Label
          htmlFor="remember"
          className="text-sm text-[var(--color-text-secondary)] cursor-pointer"
        >
          Να με θυμάσαι
        </Label>
      </div>
    </LoginCard>
  );
}

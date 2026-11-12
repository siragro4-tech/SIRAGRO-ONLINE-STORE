import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SIRAGRO account to manage orders and track deliveries.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign In to SIRAGRO
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back! Access your grocery orders, saved addresses, and faster checkout.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          <Suspense fallback={<div className="py-8 text-center text-sm text-gray-500">Loading form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}


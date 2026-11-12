import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Register for a SIRAGRO account for faster checkout, delivery address saving, and order tracking.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Create Your SIRAGRO Account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join us for simple grocery ordering, fast home delivery near UB3, and order history tracking.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}


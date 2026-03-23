import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border border-gray-100 rounded-2xl",
            headerTitle: "text-2xl font-bold",
            formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
          },
          variables: {
            colorPrimary: "#4f46e5",
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  );
}

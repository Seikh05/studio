import { LoginForm } from '@/components/auth/login-form';
import { Bot } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-primary rounded-full p-3 text-primary-foreground">
            <Bot className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 text-foreground">Robostreaks</h1>
        <p className="text-center text-muted-foreground mb-8">
          Welcome back! Sign in to manage your inventory.
        </p>
        <LoginForm />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Super-admin or admin access required.
        </p>
      </div>
    </div>
  );
}

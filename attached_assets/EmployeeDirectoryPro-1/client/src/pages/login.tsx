import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-primary-foreground">👥</span>
              </div>
              <h1 className="text-2xl font-bold text-card-foreground mb-2">Employee Directory</h1>
              <p className="text-muted-foreground">Secure access to your organization</p>
            </div>
            
            <LoginForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Need help? Contact IT Support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

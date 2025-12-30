import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AuthContainerProps {
  children: ReactNode;
  title: string;
}

export default function AuthContainer({ children, title }: AuthContainerProps) {
  return (
    <div className="min-h-screen flex justify-center items-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-primary">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

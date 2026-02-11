
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { FlaskConical } from 'lucide-react';

const auth = getAuth(app);

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
        } else {
          router.push('/login');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, [router]);

    if (loading) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative mb-4">
                    <FlaskConical className="h-16 w-16 text-primary animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                </div>
                <p className="text-muted-foreground">Verificando autenticação...</p>
            </div>
        </div>
      )
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;

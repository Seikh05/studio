
'use client';

import { redirect } from 'next/navigation';
import * as React from 'react';
import { LoaderCircle } from 'lucide-react';

export default function LoginPage() {
    React.useEffect(() => {
        redirect('/dashboard');
    }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

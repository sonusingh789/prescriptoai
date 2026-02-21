'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConversationRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    if (params?.id) router.replace(`/conversations/${params.id}`);
  }, [params?.id, router]);
  return <div className="flex min-h-screen items-center justify-center text-slate-600">Redirecting…</div>;
}

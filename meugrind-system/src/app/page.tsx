'use client';

import { AuthGuard } from "../components/auth/auth-provider";
import { AppShell } from "../components/interface/app-shell";

export default function Home() {
  return (
    <AuthGuard>
      <AppShell />
    </AuthGuard>
  );
}

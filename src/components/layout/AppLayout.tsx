import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
    children: ReactNode;
}

/**
 * AppLayout - Main layout wrapper with sidebar
 */
export function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content area */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {children}
            </main>
        </div>
    );
}

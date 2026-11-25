import { usePage } from '@inertiajs/react';
import type { User, UserRole } from '@/types/auth';

type SharedProps = {
    auth: { user: User | null };
    flash: { success?: string | null; error?: string | null };
    name: string;
    [key: string]: unknown;
};

export function useSharedProps() {
    const page = usePage<SharedProps>();
    const { auth, flash, name } = page.props;

    return {
        user: auth?.user ?? null,
        isAdmin: auth?.user?.role === 'Admin',
        isRider: auth?.user?.role === 'Rider',
        flash: flash ?? {},
        appName: name ?? 'BikePath',
        page,
    };
}

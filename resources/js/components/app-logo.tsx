import React from 'react';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-base shadow-sm">
                🚴
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
                    Bike<span className="text-emerald-600">path</span>
                </span>
            </div>
        </>
    );
}

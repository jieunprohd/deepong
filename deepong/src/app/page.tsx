import {AuthCard} from "@/features/auth/AuthCard";
import {BrandPanel} from "@/features/auth/BrandPanel";

export default function Page() {
    return (
        <main className="flex h-screen items-stretch bg-gray-100">
            <BrandPanel/>
            <AuthCard/>
        </main>
    );
}
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-center gap-3 mb-2">
            <Image src="/full-logo.png" alt="POHub by Tojuko.ID" width={150} height={150} />
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            POHub by Tojuko.ID · Jualan PO, tanpa ribetnya
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { triggerPasswordReset, setUserRole } from "@/actions/admin/users";
import { KeyRound, ShieldPlus, ShieldMinus } from "lucide-react";
import type { UserRole } from "@prisma/client";

export function UserRowActions({
  userId,
  email,
  role,
}: {
  userId: string;
  email: string;
  role: UserRole;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const nextRole: UserRole = role === "SUPER_ADMIN" ? "OWNER" : "SUPER_ADMIN";

  function handleReset() {
    startTransition(async () => {
      const result = await triggerPasswordReset(userId);
      if (result.success) {
        toast.success(`Email reset password dikirim ke ${email}`);
        setResetOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRoleChange() {
    startTransition(async () => {
      const result = await setUserRole(userId, nextRole);
      if (result.success) {
        toast.success(
          nextRole === "SUPER_ADMIN" ? "Berhasil dijadikan Super Admin" : "Berhasil dijadikan Owner"
        );
        setRoleOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
        <KeyRound className="h-3.5 w-3.5 mr-1" />
        Reset Password
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setRoleOpen(true)}
        className={role === "SUPER_ADMIN" ? "text-error hover:text-error" : ""}
      >
        {role === "SUPER_ADMIN" ? (
          <ShieldMinus className="h-3.5 w-3.5 mr-1" />
        ) : (
          <ShieldPlus className="h-3.5 w-3.5 mr-1" />
        )}
        {role === "SUPER_ADMIN" ? "Jadikan Owner" : "Jadikan Super Admin"}
      </Button>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Kirim Email Reset Password"
        description={`Email reset password akan dikirim ke ${email}.`}
        confirmLabel="Kirim"
        onConfirm={handleReset}
        loading={isPending}
      />

      <ConfirmDialog
        open={roleOpen}
        onOpenChange={setRoleOpen}
        title={nextRole === "SUPER_ADMIN" ? "Jadikan Super Admin" : "Jadikan Owner"}
        description={
          nextRole === "SUPER_ADMIN"
            ? `${email} akan mendapat akses penuh ke dashboard Super Admin.`
            : `${email} akan kehilangan akses ke dashboard Super Admin.`
        }
        confirmLabel="Konfirmasi"
        variant={nextRole === "OWNER" ? "destructive" : "default"}
        onConfirm={handleRoleChange}
        loading={isPending}
      />
    </div>
  );
}

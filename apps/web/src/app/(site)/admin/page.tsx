import type { Metadata } from "next";
import { isAdminAddress } from "@/server/admin";
import { getSession } from "@/server/session";
import { PageHead } from "@/components/site/PageHead";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function Admin() {
  const s = await getSession();
  const state = !s ? "anon" : isAdminAddress(s.address) ? "admin" : "denied";
  return (
    <>
      <PageHead kicker="Owner only" title="Admin" photo="board" />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        {state === "admin" ? <AdminConsole /> : <AdminAuth state={state} address={s?.address ?? null} />}
      </div>
    </>
  );
}

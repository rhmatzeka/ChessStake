"use client";

import dynamic from "next/dynamic";

/** The wallet stack (wagmi, ConnectKit) is only downloaded here, in the browser, on pages that show this. */
export const SignInLoader = dynamic(() => import("./SignInPanel"), {
  ssr: false,
  loading: () => (
    <button disabled className="w-full rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-black opacity-60">
      Sign in with wallet
    </button>
  ),
});

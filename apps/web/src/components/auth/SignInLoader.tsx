"use client";

import dynamic from "next/dynamic";

/** The wallet stack (wagmi, ConnectKit) is only downloaded here, in the browser, on pages that show this. */
export const SignInLoader = dynamic(() => import("./SignInPanel"), {
  ssr: false,
  loading: () => (
    <button disabled className="btn btn-gold w-full">
      Sign in with wallet
    </button>
  ),
});

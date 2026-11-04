import { Header } from "@/components/site/Header";

/** The arena is a game screen: on desktop it fills the window exactly, with no footer below it. */
export default function PlayLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col lg:h-dvh lg:flex-none lg:overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1 lg:min-h-0">
        {children}
      </main>
    </div>
  );
}

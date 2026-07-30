"use client";

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const ArenaPage = dynamic(() => import('../../../components/arena/ArenaPage'), {
  ssr: false,
});

export default function GameArenaPage() {
  const params = useParams<{ gameId: string }>();
  return <ArenaPage gameId={params.gameId} />;
}

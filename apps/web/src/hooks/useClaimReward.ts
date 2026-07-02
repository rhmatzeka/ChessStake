"use client";

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PawnPoolABI, CHAIN_ID } from 'shared';
import { PAWNPOOL_ADDRESS } from '../config/contracts';

export function useClaimReward() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimReward = async (gameId: string) => {
    const cleanGameId = gameId.replace('game_', '');
    const gameIdUint = BigInt(cleanGameId);

    writeContract({
      address: PAWNPOOL_ADDRESS,
      abi: PawnPoolABI,
      functionName: 'claimReward',
      args: [gameIdUint],
      chainId: CHAIN_ID,
    });
  };

  return {
    claimReward,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

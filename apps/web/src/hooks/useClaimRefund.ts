"use client";

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PawnPoolABI, CHAIN_ID } from 'shared';
import { PAWNPOOL_ADDRESS } from '../config/contracts';

export function useClaimRefund() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRefund = async (gameId: string) => {
    const cleanGameId = gameId.replace('game_', '');
    const gameIdUint = BigInt(cleanGameId);

    writeContract({
      address: PAWNPOOL_ADDRESS,
      abi: PawnPoolABI,
      functionName: 'claimRefund',
      args: [gameIdUint],
      chainId: CHAIN_ID,
    });
  };

  return {
    claimRefund,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

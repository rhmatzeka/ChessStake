"use client";

import { useEffect } from 'react';
import { useArenaStore, TurnStatus } from '../stores/arena-store';
import { PieceType, Team } from '../types/chess';

const API_URL = '/api';

export const useArenaSocket = () => {
  const { activeGameId, setGameState } = useArenaStore();

  const applyGameState = (game: any) => {
    let timeLeft = 20;
    if (game.turnEndsAt) {
      timeLeft = Math.max(0, Math.floor((new Date(game.turnEndsAt).getTime() - Date.now()) / 1000));
    }

    setGameState({
      activeGameId: game.gameId,
      title: game.title || null,
      description: game.description || null,
      creatorName: game.creatorName || null,
      creatorAddress: game.creatorAddress || null,
      creatorSlug: game.creatorSlug || null,
      creatorFeeBps: game.creatorFeeBps || 0,
      status: game.status,
      result: game.result,
      fen: game.fen,
      currentTurn: game.currentTurn,
      turnNumber: game.turnNumber,
      turnStatus: game.turnStatus as TurnStatus,
      turnEndsAt: game.turnEndsAt,
      timeLeft,
      whitePoolWei: game.whitePoolWei,
      blackPoolWei: game.blackPoolWei,
      votes: game.votes,
      legalPieces: game.legalPieces || [],
      moveHistory: (game.moves || []).map((move: any) => {
        const [team, type] = String(move.piece).split('_');
        return {
          id: move.id,
          from: move.from,
          to: move.to,
          piece: {
            team: team as Team,
            type: type as PieceType,
            id: `${move.piece}_${move.turnNumber}`,
          },
          san: move.san,
          turnNumber: move.turnNumber,
          createdAt: move.createdAt,
        };
      }),
    });
  };

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const res = await fetch(`${API_URL}/games/active`);
        if (!res.ok) throw new Error('Failed to fetch active game');
        const json = await res.json();
        
        if (json.ok && json.data) {
          applyGameState(json.data);
        }
      } catch (err) {
        console.error('Error fetching initial game state:', err);
      }
    };

    fetchInitialState();
  }, [setGameState]);

  useEffect(() => {
    if (!activeGameId) return;

    let cancelled = false;
    let sessionId = localStorage.getItem('chessstake_spectator_session');
    if (!sessionId) {
      sessionId = `spectator_${crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`}`;
      localStorage.setItem('chessstake_spectator_session', sessionId);
    }

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/games/${activeGameId}/state`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.ok && json.data) {
          applyGameState(json.data);
        }
      } catch (err) {
        if (!cancelled) console.error('Error polling game state:', err);
      }
    };

    const heartbeat = async () => {
      try {
        const res = await fetch(`${API_URL}/games/${activeGameId}/spectators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.ok && typeof json.data?.count === 'number') {
          setGameState({ spectatorCount: Math.max(1, json.data.count) });
        }
      } catch (err) {
        if (!cancelled) console.error('Error updating spectator heartbeat:', err);
      }
    };

    poll();
    heartbeat();
    const interval = setInterval(poll, 2000);
    const heartbeatInterval = setInterval(heartbeat, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(heartbeatInterval);
    };
  }, [activeGameId, setGameState]);

  return { socket: null };
};

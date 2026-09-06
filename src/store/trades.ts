// Trade ledger — in-memory, seeded from data
import { create } from 'zustand';
import type { Relation, RelationStatus } from '@/types';
import { TRADES } from '@/data/exchanges';
import { newId } from '@/lib/format';

interface TradeState {
  relations: Relation[];
  proposed: Relation[];
  completed: number; // count
  propose: (rel: Omit<Relation, 'id' | 'status' | 'proposedAt'>) => string;
  accept: (id: string) => void;
  decline: (id: string) => void;
  complete: (id: string) => void;
}

const seedRelations: Relation[] = TRADES.map((t) => ({
  id: t.id,
  fromId: t.fromId,
  toId: t.toId,
  status: 'completed' as RelationStatus,
  proposedAt: t.timestamp,
  hoursOffered: t.hours,
  hoursWanted: t.hours,
  skillOffered: t.skillId,
  skillWanted: t.skillId,
}));

// Incoming proposals for any new user. Real-product analogue: when someone
// joins the network, a few experienced members see a good mutual match and
// reach out. This keeps the inbox alive on first visit.
const seedProposalsForNewUser: Relation[] = [
  {
    id: 'rel.seed-1',
    fromId: 'p.mateo',
    toId: 'me',
    status: 'proposed',
    proposedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    hoursOffered: 1,
    hoursWanted: 1,
    skillOffered: 'design.generative',
    skillWanted: 'cooking.fermentation',
  },
  {
    id: 'rel.seed-2',
    fromId: 'p.aria',
    toId: 'me',
    status: 'proposed',
    proposedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    hoursOffered: 1,
    hoursWanted: 1,
    skillOffered: 'cooking.sourdough',
    skillWanted: 'design.photo',
  },
  {
    id: 'rel.seed-3',
    fromId: 'p.lena',
    toId: 'me',
    status: 'proposed',
    proposedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    hoursOffered: 1,
    hoursWanted: 1,
    skillOffered: 'design.editorial',
    skillWanted: 'craft.pottery',
  },
];

export const useTrades = create<TradeState>((set) => ({
  relations: seedRelations,
  proposed: seedProposalsForNewUser,
  completed: TRADES.length,
  propose: (rel) => {
    const id = newId('rel');
    set((s) => ({
      proposed: [
        ...s.proposed,
        { ...rel, id, status: 'proposed', proposedAt: new Date().toISOString() },
      ],
    }));
    return id;
  },
  accept: (id) =>
    set((s) => ({
      proposed: s.proposed.map((r) =>
        r.id === id ? { ...r, status: 'accepted' as RelationStatus } : r,
      ),
    })),
  decline: (id) =>
    set((s) => ({
      proposed: s.proposed.filter((r) => r.id !== id),
    })),
  complete: (id) =>
    set((s) => ({
      proposed: s.proposed.filter((r) => r.id !== id),
      relations: [
        ...s.relations,
        ...s.proposed
          .filter((r) => r.id === id)
          .map((r) => ({ ...r, status: 'completed' as RelationStatus })),
      ],
      completed: s.completed + 1,
    })),
}));

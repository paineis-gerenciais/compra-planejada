/**
 * Repositório Firestore — bloco F/E.
 *
 * Implementa exatamente a mesma interface que `MemoryRepository`. É por
 * isso que nenhum componente ou serviço precisa saber que esta classe existe:
 * `App.svelte` decide qual usar (memória, sem conta; Firestore, com conta) e
 * o resto do app não muda uma linha.
 *
 * Coleções (ver domain/types.ts para os campos):
 *   lists/{listId}                 — owner.kind + owner.id indexados
 *   lists/{listId}/items/{itemId}  — subcoleção: escrita granular de verdade
 *   purchases/{purchaseId}
 *   priceEntries/{entryId}
 *   users/{uid}
 *   households/{hid}
 *   households/{hid}/presence/{uid}
 *   householdInvites/{code}
 */

import {
  type Firestore, collection, doc, onSnapshot, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy,
  writeBatch, serverTimestamp, deleteField, arrayUnion, arrayRemove,
  Timestamp
} from 'firebase/firestore';
import type {
  Household, Invite, Item, OwnerRef, PriceEntry, Presence,
  Purchase, ShoppingList, UserProfile
} from '../domain/types';
import type { Repository, Unsubscribe } from './repository';
import { conviteValido } from '../domain/roles';

function ownerQuery(ownerField = 'owner') {
  return (owner: OwnerRef) => [
    where(`${ownerField}.kind`, '==', owner.kind),
    where(`${ownerField}.id`, '==', owner.id)
  ] as const;
}
const porDono = ownerQuery();

/** Remove `undefined` antes de gravar — o Firestore rejeita esses campos. */
function limpar<T extends object>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

export class FirestoreRepository implements Repository {
  readonly remoto = true;
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  // ---------------- listas ----------------
  lists = {
    watchLists: (owner: OwnerRef, cb: (l: ShoppingList[]) => void): Unsubscribe => {
      const q = query(collection(this.db, 'lists'), ...porDono(owner));
      return onSnapshot(q, (snap) => {
        const vivas = snap.docs
          .map((d) => d.data() as ShoppingList)
          .filter((l) => l.deletedAt == null)
          .sort((a, b) => a.createdAt - b.createdAt);
        cb(vivas);
      }, (err) => console.error('watchLists', err));
    },

    getList: async (id: string) => {
      const snap = await getDoc(doc(this.db, 'lists', id));
      return snap.exists() ? (snap.data() as ShoppingList) : null;
    },

    createList: async (list: ShoppingList) => {
      await setDoc(doc(this.db, 'lists', list.id), limpar(list));
    },

    updateList: async (id: string, patch: Partial<ShoppingList>) => {
      await updateDoc(doc(this.db, 'lists', id), limpar({ ...patch, updatedAt: Date.now() }));
    },

    deleteList: async (id: string) => {
      const ts = Date.now();
      const batch = writeBatch(this.db);
      batch.update(doc(this.db, 'lists', id), { deletedAt: ts, updatedAt: ts });
      const itensSnap = await getDocs(collection(this.db, 'lists', id, 'items'));
      itensSnap.forEach((d) => batch.update(d.ref, { deletedAt: ts, updatedAt: ts }));
      await batch.commit();
    },

    /**
     * Mover lista entre pessoal e família — pendência 1. Uma escrita no
     * campo `owner`; os itens continuam na mesma subcoleção, então nada
     * mais precisa mudar. As regras conferem permissão nos dois lados.
     */
    moveList: async (id: string, novoOwner: OwnerRef) => {
      await updateDoc(doc(this.db, 'lists', id), { owner: novoOwner, updatedAt: Date.now() });
    }
  };

  // ---------------- itens ----------------
  items = {
    watchItems: (listId: string, cb: (i: Item[]) => void): Unsubscribe => {
      const q = collection(this.db, 'lists', listId, 'items');
      return onSnapshot(q, (snap) => {
        const vivos = snap.docs
          .map((d) => d.data() as Item)
          .filter((i) => i.deletedAt == null)
          .sort((a, b) => a.position - b.position);
        cb(vivos);
      }, (err) => console.error('watchItems', err));
    },

    getItems: async (listId: string) => {
      const snap = await getDocs(collection(this.db, 'lists', listId, 'items'));
      return snap.docs.map((d) => d.data() as Item)
        .filter((i) => i.deletedAt == null)
        .sort((a, b) => a.position - b.position);
    },

    addItem: async (item: Item) => {
      await setDoc(doc(this.db, 'lists', item.listId, 'items', item.id), limpar(item));
    },

    addItems: async (items: Item[]) => {
      if (!items.length) return;
      // Firestore limita 500 escritas por lote.
      for (let i = 0; i < items.length; i += 450) {
        const batch = writeBatch(this.db);
        for (const it of items.slice(i, i + 450)) {
          batch.set(doc(this.db, 'lists', it.listId, 'items', it.id), limpar(it));
        }
        await batch.commit();
      }
    },

    updateItem: async (listId: string, itemId: string, patch: Partial<Item>) => {
      await updateDoc(doc(this.db, 'lists', listId, 'items', itemId), limpar({ ...patch, updatedAt: Date.now() }));
    },

    deleteItem: async (listId: string, itemId: string) => {
      const ts = Date.now();
      await updateDoc(doc(this.db, 'lists', listId, 'items', itemId), { deletedAt: ts, updatedAt: ts });
    },

    reassignItems: async (listId: string, novoListId: string) => {
      const snap = await getDocs(collection(this.db, 'lists', listId, 'items'));
      const batch = writeBatch(this.db);
      snap.forEach((d) => {
        const item = { ...(d.data() as Item), listId: novoListId, updatedAt: Date.now() };
        batch.set(doc(this.db, 'lists', novoListId, 'items', item.id), limpar(item));
        batch.delete(d.ref);
      });
      await batch.commit();
    }
  };

  // ---------------- compras ----------------
  purchases = {
    watchPurchases: (owner: OwnerRef, cb: (p: Purchase[]) => void): Unsubscribe => {
      const q = query(collection(this.db, 'purchases'), ...porDono(owner));
      return onSnapshot(q, (snap) => {
        const lista = snap.docs.map((d) => d.data() as Purchase).sort((a, b) => b.finishedAt - a.finishedAt);
        cb(lista);
      }, (err) => console.error('watchPurchases', err));
    },
    addPurchase: async (p: Purchase) => {
      await setDoc(doc(this.db, 'purchases', p.id), limpar(p));
    },
    deletePurchase: async (id: string) => {
      await deleteDoc(doc(this.db, 'purchases', id));
    }
  };

  // ---------------- preços ----------------
  prices = {
    watchPrices: (owner: OwnerRef, cb: (e: PriceEntry[]) => void): Unsubscribe => {
      const q = query(collection(this.db, 'priceEntries'), ...porDono(owner));
      return onSnapshot(q, (snap) => {
        const lista = snap.docs.map((d) => d.data() as PriceEntry).sort((a, b) => b.date - a.date);
        cb(lista);
      }, (err) => console.error('watchPrices', err));
    },
    addEntries: async (entries: PriceEntry[]) => {
      if (!entries.length) return;
      const batch = writeBatch(this.db);
      for (const e of entries) batch.set(doc(this.db, 'priceEntries', e.id), limpar(e));
      await batch.commit();
    },
    prune: async (owner: OwnerRef, anteriorA: number) => {
      const q = query(collection(this.db, 'priceEntries'), ...porDono(owner), where('date', '<', anteriorA));
      const snap = await getDocs(q);
      if (snap.empty) return 0;
      const batch = writeBatch(this.db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return snap.size;
    }
  };

  // ---------------- perfil ----------------
  profiles = {
    watchProfile: (uid: string, cb: (p: UserProfile | null) => void): Unsubscribe =>
      onSnapshot(doc(this.db, 'users', uid), (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
        (err) => console.error('watchProfile', err)),

    getProfile: async (uid: string) => {
      const snap = await getDoc(doc(this.db, 'users', uid));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    },

    saveProfile: async (p: UserProfile) => {
      await setDoc(doc(this.db, 'users', p.uid), limpar(p));
    },

    updateProfile: async (uid: string, patch: Partial<UserProfile>) => {
      await updateDoc(doc(this.db, 'users', uid), limpar({ ...patch, updatedAt: Date.now() }));
    }
  };

  // ---------------- famílias ----------------
  households = {
    watchMyHouseholds: (uid: string, cb: (h: Household[]) => void): Unsubscribe => {
      const q = query(collection(this.db, 'households'), where('memberUids', 'array-contains', uid));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Household)),
        (err) => console.error('watchMyHouseholds', err));
    },

    watchHousehold: (hid: string, cb: (h: Household | null) => void): Unsubscribe =>
      onSnapshot(doc(this.db, 'households', hid), (snap) => cb(snap.exists() ? (snap.data() as Household) : null),
        (err) => console.error('watchHousehold', err)),

    createHousehold: async (h: Household) => {
      await setDoc(doc(this.db, 'households', h.id), limpar(h));
    },

    updateHousehold: async (hid: string, patch: Partial<Household>) => {
      await updateDoc(doc(this.db, 'households', hid), limpar({ ...patch, updatedAt: Date.now() }));
    },

    deleteHousehold: async (hid: string) => {
      await deleteDoc(doc(this.db, 'households', hid));
    },

    setMemberRole: async (hid: string, uid: string, role: Household['members'][string]['role']) => {
      await updateDoc(doc(this.db, 'households', hid), {
        [`members.${uid}.role`]: role,
        updatedAt: Date.now()
      });
    },

    removeMember: async (hid: string, uid: string) => {
      await updateDoc(doc(this.db, 'households', hid), {
        memberUids: arrayRemove(uid),
        [`members.${uid}`]: deleteField(),
        updatedAt: Date.now()
      });
    },

    createInvite: async (inv: Invite) => {
      await setDoc(doc(this.db, 'householdInvites', inv.code), limpar(inv));
    },

    getInvite: async (code: string) => {
      const snap = await getDoc(doc(this.db, 'householdInvites', code.toUpperCase()));
      return snap.exists() ? (snap.data() as Invite) : null;
    },

    revokeInvite: async (code: string) => {
      await updateDoc(doc(this.db, 'householdInvites', code.toUpperCase()), { revokedAt: Date.now() });
    },

    listInvites: async (hid: string) => {
      const q = query(collection(this.db, 'householdInvites'), where('householdId', '==', hid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Invite).sort((a, b) => b.createdAt - a.createdAt);
    },

    /**
     * BUG CORRIGIDO: a versão anterior lia o documento da família
     * (`tx.get(hRef)`) ANTES de a pessoa virar membro — mas a regra de
     * leitura de `households/{hid}` exige `souMembro(hid)`, e quem está
     * entrando ainda não é membro nesse instante. A leitura era negada
     * pela própria regra de segurança, e o convite parava de funcionar
     * silenciosamente para qualquer pessoa nova (só reentrar já sendo
     * membro "funcionava", o que escondia o problema).
     *
     * Correção: escrever primeiro. `arrayUnion` e a definição de um campo
     * específico (`members.${uid}`) não exigem ler o documento antes — a
     * regra de `update` avalia o estado atual do documento por conta
     * própria, no servidor, independente de o cliente ter lido ou não.
     * Só depois de a escrita ter sucesso — quando a pessoa já é membro de
     * verdade — é que uma leitura acontece, e nesse momento ela já é
     * permitida. Trocado transação por duas chamadas simples: não há mais
     * necessidade de atomicidade entre ler o convite e escrever a
     * entrada — o pior cenário de corrida (convite revogado no instante
     * exato entre as duas chamadas) só atrasaria a revogação em um caso
     * raríssimo, não compromete segurança nenhuma.
     */
    joinByInvite: async (code: string, uid: string, nome: string) => {
      const codeUp = code.trim().toUpperCase();
      try {
        const invSnap = await getDoc(doc(this.db, 'householdInvites', codeUp));
        if (!invSnap.exists()) return { ok: false as const, erro: 'Convite não encontrado. Confira o código.' };
        const inv = invSnap.data() as Invite;
        if (inv.revokedAt != null) return { ok: false as const, erro: 'Este convite foi cancelado.' };
        if (!conviteValido(inv)) return { ok: false as const, erro: 'Este convite expirou. Peça um novo.' };

        const hRef = doc(this.db, 'households', inv.householdId);
        await updateDoc(hRef, {
          memberUids: arrayUnion(uid),
          [`members.${uid}`]: { role: inv.role, name: nome, joinedAt: Date.now(), inviteCode: codeUp },
          updatedAt: Date.now()
        });

        const hSnap = await getDoc(hRef); // agora a pessoa já é membro — leitura permitida
        if (!hSnap.exists()) return { ok: false as const, erro: 'Esta família não existe mais.' };
        return { ok: true as const, household: hSnap.data() as Household };
      } catch (e: any) {
        console.error('Erro ao entrar na família', e);
        return { ok: false as const, erro: 'Não foi possível entrar agora. Tente de novo.' };
      }
    },

    watchPresence: (hid: string, cb: (p: Presence[]) => void): Unsubscribe => {
      const q = collection(this.db, 'households', hid, 'presence');
      return onSnapshot(q, (snap) => {
        const agora = Date.now();
        cb(snap.docs.map((d) => d.data() as Presence).filter((p) => agora - p.lastSeen < 90_000));
      }, (err) => console.error('watchPresence', err));
    },

    heartbeat: async (hid: string, p: Presence) => {
      await setDoc(doc(this.db, 'households', hid, 'presence', p.uid), limpar(p));
    }
  };
}

import {
  CrudappAccount,
  getCloseInstruction,
  getCrudappProgramAccounts,
  getCrudappProgramId,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
  getJournalProgram,
} from '@project/anchor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { generateKeyPairSigner } from 'gill'
import { useWalletUi } from '@wallet-ui/react'
import { useWalletTransactionSignAndSend } from '../solana/use-wallet-transaction-sign-and-send'
import { useClusterVersion } from '@/components/cluster/use-cluster-version'
import { toastTx } from '@/components/toast-tx'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { PublicKey } from '@solana/web3.js'
import { useAnchorProvider } from '../solana/solana-provider'

interface CreateEntryArgs {
  title: string
  message: string
  owner: PublicKey
}

export function useCrudappProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getCrudappProgramId(cluster.id), [cluster])
}

export function useCrudappProgram() {
  const { client, cluster } = useWalletUi()
  const programId = useCrudappProgramId()
  const query = useClusterVersion()

  return useQuery({
    retry: false,
    queryKey: ['get-program-account', { cluster, clusterVersion: query.data }],
    queryFn: () => client.rpc.getAccountInfo(programId).send(),
  })
}

export function useCrudappInitializeMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => {
      const crudapp = await generateKeyPairSigner()
      return await signAndSend(getInitializeInstruction({ payer: signer, crudapp }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['crudapp', 'accounts', { cluster }] })
    },
    onError: () => toast.error('Failed to run program'),
  })
}

export function useCrudappDecrementMutation({ crudapp }: { crudapp: CrudappAccount }) {
  const invalidateAccounts = useCrudappAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ crudapp: crudapp.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useCrudappIncrementMutation({ crudapp }: { crudapp: CrudappAccount }) {
  const invalidateAccounts = useCrudappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ crudapp: crudapp.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useCrudappSetMutation({ crudapp }: { crudapp: CrudappAccount }) {
  const invalidateAccounts = useCrudappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async (value: number) =>
      await signAndSend(
        getSetInstruction({
          crudapp: crudapp.address,
          value,
        }),
        signer,
      ),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useCrudappCloseMutation({ crudapp }: { crudapp: CrudappAccount }) {
  const invalidateAccounts = useCrudappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => {
      return await signAndSend(getCloseInstruction({ payer: signer, crudapp: crudapp.address }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useCrudappAccountsQuery() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: useCrudappAccountsQueryKey(),
    queryFn: async () => await getCrudappProgramAccounts(client.rpc),
  })
}

function useCrudappAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useCrudappAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}

function useCrudappAccountsQueryKey() {
  const { cluster } = useWalletUi()

  return ['crudapp', 'accounts', { cluster }]
}

export const createEntry = async ({ crudapp }: { crudapp: CrudappAccount }) => {
  const { cluster } = useWalletUi()
  const provider = useAnchorProvider()
  const program = getJournalProgram(provider)
  const account = useCrudappAccountsQuery()

  return useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ['journalEntry', 'create', { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      return program.methods.createJournalEntry(title, message).rpc()
    },
    onSuccess: (signature) => {
      alert(signature)
      account.refetch()
    },
    onError: (error) => {
      alert(`Error creating entry: ${error.message}`)
    },
  })
}

export const updateEntry = async ({ crudapp }: { crudapp: CrudappAccount }) => {
  const { cluster } = useWalletUi()
  const provider = useAnchorProvider()
  const program = getJournalProgram(provider)
  const account = useCrudappAccountsQuery()

  return useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ['journalEntry', 'update', { cluster }],
    mutationFn: async ({ title, message }) => {
      return program.methods.updateJournalEntry(title, message).rpc()
    },
    onSuccess: (signature) => {
      alert(signature)
      account.refetch()
    },
    onError: (error) => {
      alert(`Error creating entry: ${error.message}`)
    },
  })
}

export const deleteEntry = async ({ crudapp }: { crudapp: CrudappAccount }) => {
  const { cluster } = useWalletUi()
  const provider = useAnchorProvider()
  const program = getJournalProgram(provider)
  const account = useCrudappAccountsQuery()

  return useMutation({
    mutationKey: ['journalEntry', 'delete', { cluster }],
    mutationFn: (title: string) => {
      return program.methods.deleteJournalEntry(title).rpc()
    },
    onSuccess: (signature) => {
      alert(signature)
      account.refetch()
    },
  })
}

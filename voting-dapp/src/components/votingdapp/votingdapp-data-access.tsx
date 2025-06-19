import {
  VotingdappAccount,
  getCloseInstruction,
  getVotingdappProgramAccounts,
  getVotingdappProgramId,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
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

export function useVotingdappProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getVotingdappProgramId(cluster.id), [cluster])
}

export function useVotingdappProgram() {
  const { client, cluster } = useWalletUi()
  const programId = useVotingdappProgramId()
  const query = useClusterVersion()

  return useQuery({
    retry: false,
    queryKey: ['get-program-account', { cluster, clusterVersion: query.data }],
    queryFn: () => client.rpc.getAccountInfo(programId).send(),
  })
}

export function useVotingdappInitializeMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => {
      const votingdapp = await generateKeyPairSigner()
      return await signAndSend(getInitializeInstruction({ payer: signer, votingdapp }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['votingdapp', 'accounts', { cluster }] })
    },
    onError: () => toast.error('Failed to run program'),
  })
}

export function useVotingdappDecrementMutation({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const invalidateAccounts = useVotingdappAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ votingdapp: votingdapp.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useVotingdappIncrementMutation({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const invalidateAccounts = useVotingdappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ votingdapp: votingdapp.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useVotingdappSetMutation({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const invalidateAccounts = useVotingdappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async (value: number) =>
      await signAndSend(
        getSetInstruction({
          votingdapp: votingdapp.address,
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

export function useVotingdappCloseMutation({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const invalidateAccounts = useVotingdappAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => {
      return await signAndSend(getCloseInstruction({ payer: signer, votingdapp: votingdapp.address }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useVotingdappAccountsQuery() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: useVotingdappAccountsQueryKey(),
    queryFn: async () => await getVotingdappProgramAccounts(client.rpc),
  })
}

function useVotingdappAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useVotingdappAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}

function useVotingdappAccountsQueryKey() {
  const { cluster } = useWalletUi()

  return ['votingdapp', 'accounts', { cluster }]
}

import {
  CrudappAccount,
  getCloseInstruction,
  getCrudappProgramAccounts,
  getCrudappProgramId,
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

import { ellipsify } from '@wallet-ui/react'
import {
  useVotingdappAccountsQuery,
  useVotingdappCloseMutation,
  useVotingdappDecrementMutation,
  useVotingdappIncrementMutation,
  useVotingdappInitializeMutation,
  useVotingdappProgram,
  useVotingdappProgramId,
  useVotingdappSetMutation,
} from './votingdapp-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExplorerLink } from '../cluster/cluster-ui'
import { VotingdappAccount } from '@project/anchor'
import { ReactNode } from 'react'

export function VotingdappProgramExplorerLink() {
  const programId = useVotingdappProgramId()

  return <ExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}

export function VotingdappList() {
  const votingdappAccountsQuery = useVotingdappAccountsQuery()

  if (votingdappAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!votingdappAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {votingdappAccountsQuery.data?.map((votingdapp) => <VotingdappCard key={votingdapp.address} votingdapp={votingdapp} />)}
    </div>
  )
}

export function VotingdappProgramGuard({ children }: { children: ReactNode }) {
  const programAccountQuery = useVotingdappProgram()

  if (programAccountQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!programAccountQuery.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }

  return children
}

function VotingdappCard({ votingdapp }: { votingdapp: VotingdappAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Votingdapp: {votingdapp.data.count}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink address={votingdapp.address} label={ellipsify(votingdapp.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <VotingdappButtonIncrement votingdapp={votingdapp} />
          <VotingdappButtonSet votingdapp={votingdapp} />
          <VotingdappButtonDecrement votingdapp={votingdapp} />
          <VotingdappButtonClose votingdapp={votingdapp} />
        </div>
      </CardContent>
    </Card>
  )
}

export function VotingdappButtonInitialize() {
  const mutationInitialize = useVotingdappInitializeMutation()

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Votingdapp {mutationInitialize.isPending && '...'}
    </Button>
  )
}

export function VotingdappButtonIncrement({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const incrementMutation = useVotingdappIncrementMutation({ votingdapp })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}

export function VotingdappButtonSet({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const setMutation = useVotingdappSetMutation({ votingdapp })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', votingdapp.data.count.toString() ?? '0')
        if (!value || parseInt(value) === votingdapp.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}

export function VotingdappButtonDecrement({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const decrementMutation = useVotingdappDecrementMutation({ votingdapp })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}

export function VotingdappButtonClose({ votingdapp }: { votingdapp: VotingdappAccount }) {
  const closeMutation = useVotingdappCloseMutation({ votingdapp })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}

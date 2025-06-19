import { WalletButton } from '../solana/solana-provider'
import { VotingdappButtonInitialize, VotingdappList, VotingdappProgramExplorerLink, VotingdappProgramGuard } from './votingdapp-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'

export default function VotingdappFeature() {
  const { account } = useWalletUi()

  return (
    <VotingdappProgramGuard>
      <AppHero
        title="Votingdapp"
        subtitle={
          account
            ? "Initialize a new votingdapp onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <VotingdappProgramExplorerLink />
        </p>
        {account ? (
          <VotingdappButtonInitialize />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletButton />
          </div>
        )}
      </AppHero>
      {account ? <VotingdappList /> : null}
    </VotingdappProgramGuard>
  )
}

import { WalletButton } from '../solana/solana-provider'
import { CrudappButtonInitialize, CrudappList, CrudappProgramExplorerLink, CrudappProgramGuard } from './crudapp-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'

export default function CrudappFeature() {
  const { account } = useWalletUi()

  return (
    <CrudappProgramGuard>
      <AppHero
        title="Crudapp"
        subtitle={
          account
            ? "Initialize a new crudapp onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <CrudappProgramExplorerLink />
        </p>
        {account ? (
          <CrudappButtonInitialize />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletButton />
          </div>
        )}
      </AppHero>
      {account ? <CrudappList /> : null}
    </CrudappProgramGuard>
  )
}

import { Voting } from '../target/types/voting'
import { startAnchor } from 'solana-bankrun'
import { BankrunProvider } from 'anchor-bankrun'
import { PublicKey } from '@solana/web3.js'
import { Program } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor'

const IDL = require('../target/idl/voting.json')

const votingAddress = new PublicKey('JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H')

describe('Voting', () => {
  let context
  let provider
  let votingProgram

  beforeAll(async () => {
    context = await startAnchor('', [{ name: 'voting', programId: votingAddress }], [])
    provider = new BankrunProvider(context)

    votingProgram = new Program<Voting>(IDL, provider)
  })

  it('Initialize Poll', async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        'What is your favorite type of peanut butter?',
        new anchor.BN(0),
        new anchor.BN(1850422739),
      )
      .rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    console.log(poll)

    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual('What is your favorite type of peanut butter?')
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber())
  })

  it('initialize candidate', async () => {
    await votingProgram.methods.initializeCandidate('Walao eh', new anchor.BN(1)).rpc()
    await votingProgram.methods.initializeCandidate('heho', new anchor.BN(1)).rpc()

    const [walaoEhAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Walao eh')],
      votingAddress,
    )
    const walaoEhCandidate = await votingProgram.account.candidate.fetch(walaoEhAddress)

    expect(walaoEhCandidate.candidateVotes.toNumber()).toEqual(0)

    const [hehoAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('heho')],
      votingAddress,
    )
    const hehoCandidate = await votingProgram.account.candidate.fetch(hehoAddress)

    expect(hehoCandidate.candidateVotes.toNumber()).toEqual(0)
  })

  it('vote', async () => {
    await votingProgram.methods.vote('Walao eh', new anchor.BN(1)).rpc()
    const [walaoEhAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Walao eh')],
      votingAddress,
    )
    const walaoEhCandidate = await votingProgram.account.candidate.fetch(walaoEhAddress)

    expect(walaoEhCandidate.candidateVotes.toNumber()).toEqual(1)
  })
})

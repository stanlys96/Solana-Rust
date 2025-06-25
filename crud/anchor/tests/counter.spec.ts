import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Crudapp } from '../target/types/crudapp';

const IDL = require('../target/idl/crudapp.json');

const journalAddress = new PublicKey(
  '2bDkHFJxDg8cynpPw2f4BL5boauydYdjrBnqwK4pQNNe'
);

describe('crudapp', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let crudProgram = anchor.workspace.Crudapp as Program<Crudapp>;

  it('Read the journal entry', async () => {
    const currentTitle = 'Yoel Romero';
    const currentDescription = 'I am the champion!';
    await crudProgram.methods
      .createJournalEntry(currentTitle, currentDescription)
      .rpc();
    const [journalEntryPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(currentTitle), provider.wallet.publicKey.toBuffer()],
      crudProgram.programId
    );
    const journalAccount = await crudProgram.account.journalEntryState.fetch(
      journalEntryPDA
    );
    console.log(journalEntryPDA);
    console.log(journalAccount);
    await crudProgram.methods.deleteJournalEntry(currentTitle).rpc();
  });

  it('Fetch all journal entries', async () => {
    const allJournalEntries = await crudProgram.account.journalEntryState.all();

    for (const entry of allJournalEntries) {
      console.log(entry);
      console.log('-----------');
    }
  });

  it('Create a journal entry', async () => {
    const currentTitle = 'Israel Adesanya';
    const currentDescription = 'I am the champion!';
    await crudProgram.methods
      .createJournalEntry(currentTitle, currentDescription)
      .rpc();
    const [journalEntryPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(currentTitle), provider.wallet.publicKey.toBuffer()],
      crudProgram.programId
    );
    const journalAccount = await crudProgram.account.journalEntryState.fetch(
      journalEntryPDA
    );
    expect(journalAccount.title).toEqual(currentTitle);
    expect(journalAccount.message).toEqual(currentDescription);
    const updatedDescription = 'I am the double champion!';
    await crudProgram.methods
      .updateJournalEntry(currentTitle, updatedDescription)
      .rpc();
    const [secondJournalEntryPDA] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(currentTitle), provider.wallet.publicKey.toBuffer()],
        crudProgram.programId
      );
    const secondJournalAccount =
      await crudProgram.account.journalEntryState.fetch(secondJournalEntryPDA);
    expect(secondJournalAccount.message).toEqual(updatedDescription);
    console.log(secondJournalEntryPDA);
    console.log(secondJournalAccount);
    await crudProgram.methods.deleteJournalEntry(currentTitle).rpc();
  });
});

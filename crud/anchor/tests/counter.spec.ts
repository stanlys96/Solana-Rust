import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Crudapp } from '../target/types/crudapp';

const IDL = require('../target/idl/crudapp.json');

const journalAddress = new PublicKey(
  '2bDkHFJxDg8cynpPw2f4BL5boauydYdjrBnqwK4pQNNe'
);

describe('crudapp', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let crudProgram = anchor.workspace.Crudapp as Program<Crudapp>;

  it('Create a journal entry', async () => {
    await crudProgram.methods
      .createJournalEntry('Hello world!!!', 'I am the champion!')
      .rpc();
  });
});

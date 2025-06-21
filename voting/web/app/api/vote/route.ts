import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from '@solana/actions';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Voting } from '@/../anchor/target/types/voting';
import { BN, Program } from '@coral-xyz/anchor';

const IDL = require('@/../anchor/target/idl/voting.json');

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWhqaHgIkE_KfZz0Isf5l8Ui8Kh-EMORn83Q&s',
    title: 'Vote for your favorite of peanut butter!',
    description: 'Vote between crunchy and smooth peanut butter.',
    label: 'Vote',
    links: {
      actions: [
        {
          label: 'Vote for Crunchy',
          type: 'post',
          href: '/api/vote?candidate=Crunchy',
        },
        {
          label: 'Vote for Smooth',
          type: 'post',
          href: '/api/vote?candidate=Smooth',
        },
      ],
    },
  };
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get('candidate');

  if (candidate !== 'Crunchy' && candidate !== 'Smooth') {
    return new Response('Invalid candidate', {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const program: Program<Voting> = new Program(IDL, { connection });
  const body: ActionPostRequest = await request.json();
  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (err) {
    return new Response('Invalid account', {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
  const instruction = await program.methods
    .vote(candidate, new BN(2))
    .accounts({ signer: voter })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    recentBlockhash: blockhash.blockhash,
  }).add(instruction);
  const response = await createPostResponse({
    fields: { transaction: transaction, type: 'transaction' },
  });
  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}

import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile();

await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL
);

console.log("Loaded user", user.publicKey.toBase58());
const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log("Set up Umi instance for user");

const collectionMint = generateSigner(umi);

try {
  const transaction = createNft(umi, {
    mint: collectionMint,
    name: "My Collection",
    symbol: "MC",
    uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-collection-offchain-data.json",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  });

  const result = await transaction.sendAndConfirm(umi);
  console.log("NFT created with tx:", result.signature);

  const createdCollectionNft = await fetchDigitalAsset(
    umi,
    collectionMint.publicKey
  );

  console.log(
    `Created Collection! Address is ${getExplorerLink(
      "address",
      createdCollectionNft.mint.publicKey,
      "devnet"
    )}`
  );
} catch (err) {
  console.error("Failed to create NFT:", err);
}

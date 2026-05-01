
const { Connection, PublicKey } = require("@solana/web3.js");

async function checkBalance() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const publicKey = new PublicKey("5L9gFTDpsVvWWYyFpL6thhxpoY7iFUV5UY6Jt8S5vAzc");
  const balance = await connection.getBalance(publicKey);
  console.log(`Balance: ${balance / 1_000_000_000} SOL`);
}

checkBalance().catch(console.error);

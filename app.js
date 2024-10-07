const express = require("express");
const web3 = require("@solana/web3.js");
const bs58 = require("bs58");

const app = express();
const PORT = 3000;

app.use(express.json());

const connection = new web3.Connection("https://api.devnet.solana.com");

app.post("/transfer", async (req, res) => {
    const { senderPrivateKey, receiverPublicKey, amount } = req.body;
    const senderWallet = web3.Keypair.fromSecretKey(bs58.default.decode(senderPrivateKey));

    if (!senderPrivateKey || !receiverPublicKey || !amount) {
        return res.status(400).json({ error: "receiverPublicKey and amount are required." });
    }

    try {
        const receiver = new web3.PublicKey(receiverPublicKey);

        let transaction = new web3.Transaction().add(
            web3.SystemProgram.transfer({
                fromPubkey: senderWallet.publicKey,
                toPubkey: receiver,
                lamports: amount * web3.LAMPORTS_PER_SOL
            })
        );

        transaction.feePayer = senderWallet.publicKey;

        let { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        await transaction.sign(senderWallet);

        let transactionHash = await connection.sendRawTransaction(transaction.serialize());
        let senderBalance = await connection.getBalance(senderWallet.publicKey);

        return res.status(200).json({ transactionHash, balance: (senderBalance / web3.LAMPORTS_PER_SOL - amount)});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Transfer failed." });
    }
});

app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
});                                   
 

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const utils = require("ethereum-cryptography/utils");

const ethers = require("ethers");
app.use(cors());
app.use(express.json());
const { secp256k1 } = require("ethereum-cryptography/secp256k1");

const balances = {
  "0321b317248b578f6f65ddff5930daf96aef6075f326ab4c9094d86a9ec15847b8": 100,
  "022e5802b7c6d81e91eca020146f109d98c8b650bd9b3a2f8b680f86e5fb9012a0": 50,
  "02cecfa7767f3192cabf3514f85ae530ed4496e9c556f57e47d6660680ddb26d0b": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});
function hashMessage(message) {
  const bytes = utils.utf8ToBytes(message);
  const hash = ethers.keccak256(bytes);
  return hash;
}

app.post("/send", (req, res) => {
  const { sign, recipient, amount, sender } = req.body;
  setInitialBalance(sender);
  setInitialBalance(recipient);
  const message = `I want to send ${amount} to ${recipient}`;
  const hashedMessage = hashMessage(message);
  const signature = JSON.parse(sign);
  signature.r = BigInt(signature.r);
  signature.s = BigInt(signature.s);
  const isSigned = secp256k1.verify(signature, hashedMessage.slice(2), sender);
  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else if (isSigned) {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.post("/generate", (req, res) => {
  const { amount, address } = req.body;
  if (amount <= 0) {
    res.status(400).send({ message: "needs to be above 0" });
  } else {
    balances[address] = amount;
    res.send({ message: "it worked!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

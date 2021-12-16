const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const SHA256 = require('crypto-js/sha256');

const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

let initialKeys = 3;

const accounts = {};

for (let key = 0; key < initialKeys; key++) {
  const testkey = ec.genKeyPair();
  accounts[testkey.getPublic().encode('hex').slice(0, 10)] = {number: key, pubKey: testkey.getPublic(), balance: 50, private: testkey.getPrivate().toString(16)};
}

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());



app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  let balance;
  try{balance = accounts[address.toLowerCase()].balance || 0; }
  catch(err) {balance = 0;}
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {message, signature} = req.body;
  if (testInput(message, signature)) {
    const sender = (JSON.parse(message).key);
    const recipient = JSON.parse(message).recipient.toLowerCase();
    const amount = JSON.parse(message).amount;
    
    if (accounts[recipient] == undefined) {
      res.send({balance: -1, outcome: "No such account"}); return;}
    else {
      if (isNaN(amount)) {res.send({balance: -1, outcome: "Amount to send is not a number!"}); return;}
      if (accounts[sender].balance < amount) {res.send({balance:-1, outcome: "Balance too Low!"}); return;}
      accounts[sender].balance -= amount;
      accounts[recipient].balance = (accounts[recipient].balance || 0) + +amount;
      res.send({ balance: accounts[sender].balance, outcome: "Money Sent" });
    }
  } 
  else {res.send({balance:-1, outcome: "Incorrect signature, no transaction was completed"});}
});

function testInput(message, signature) {
  const details = JSON.parse(message);
  try {details.key = accounts[details.key].pubKey;}
  catch(err) {return false;}
  const key = ec.keyFromPublic(details.key);
  return key.verify(SHA256(message).toString(), signature);  
}

app.post('/newKey', (req, res) => {
  const parsed =req.body;

  const pkey = {x: parsed.pubKey[0], y: parsed.pubKey[1]};
  const key = ec.keyFromPublic(pkey);
  accounts[key.getPublic().encode('hex').slice(0, 10)] = {number: Object.keys(accounts).length, pubKey: key.getPublic(), balance: 50}
  res.send({message: 'success'});
});
  


app.listen(port, () => {

  console.log("Available Accounts:");
  for (const [account, details] of Object.entries(accounts)) {
    console.log(details.number, account, details.balance);
  }
  console.log("\n");
  console.log("Private Keys:");
  for (const [account, details] of Object.entries(accounts)) {
    console.log(details.number, details.private);
  }
});


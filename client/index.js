import "./index.scss";

const server = "http://localhost:3042";

const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

const ec = new EC('secp256k1');

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  console.log('part 1');
  fetch(`${server}/balance/${value}`).then((response) => {
    console.log('part2');
    return response.json();
  }).then(({ balance }) => {
    console.log('part3')
    document.getElementById("balance").innerHTML = balance;
  });
});

function messageToServer(yourKey, amount, recipient) {
  const key = ec.keyFromPrivate(yourKey);
  const message = {
    key: document.getElementById("exchange-address").value,   // key.getPublic(),
    amount: amount,
    recipient: recipient
  };
  const msg = JSON.stringify(message);
  return {message: msg, signature: key.sign(SHA256(msg).toString())};
}

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("private-key").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const msgs = messageToServer(sender, amount, recipient);

  const body = JSON.stringify(msgs);

  const requesti = new Request(`${server}/send`, { method: 'POST', body });

  fetch(requesti, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ balance, outcome }) => {
    if (balance != -1) {document.getElementById("balance").innerHTML = balance};
    document.getElementById("outcome").innerHTML = outcome;
  });
});

document.getElementById("newKey").addEventListener('click', () => {
  console.log('why');
  const newKey = ec.genKeyPair();
  const pubKey = newKey.getPublic();
  const body = JSON.stringify({pubKey});
  const request = new Request(`${server}/newKey/`, {method: 'POST', body});

  fetch(request, { headers: {'Content-Type': 'application/json' }}).then(response => {
      return response.json();
  }).then(({ming}) => {
    document.getElementById("private-key").value = newKey.getPrivate().toString(16);
    document.getElementById("pubkey").innerHTML = "Corresponds to Public Key: " + newKey.getPublic().encode('hex').slice(0, 10);
  });

});

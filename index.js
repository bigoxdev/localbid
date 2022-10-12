const ethers = require("ethers");
const Web3   = require("web3");
const bip39  = require("bip39");
const fs = require('fs');

const apis = require('./nodes.json');
const tokens = [["ETH", null], ...require('./tokens.json')];
const minABI = [
    // balanceOf
    {
        "constant":true,
        "inputs":[{"name":"_owner","type":"address"}],
        "name":"balanceOf",
        "outputs":[{"name":"balance","type":"uint256"}],
        "type":"function"
    },
    // decimals
    {
        "constant":true,
        "inputs":[],
        "name":"decimals",
        "outputs":[{"name":"","type":"uint8"}],
        "type":"function"
    }
];
async function checkToken(provider, token, address) {
    try {
        let balance;
        if(token === null) balance = await provider.eth.getBalance(address);
        else {
            let contract = new provider.eth.Contract(minABI, token);
            balance = await contract.methods.balanceOf(address).call();
        }

        if(isNaN(balance)) {
            return Promise.resolve(0);
        }
        else {
            return Promise.resolve(parseFloat(balance));
        }
    }
    catch(err) {
        console.log(err);
        return Promise.reject(err);
    }
}

async function main() {
    while(1){
        try {
            let mnemonic = bip39.generateMnemonic();
            let wallet   = ethers.Wallet.fromMnemonic(mnemonic);
            let address  = wallet.address;
            let i, j;
            let goals = [];
            for(i = 0; i < tokens.length; i++) {
                console.log('checking ', tokens[i][0]);
                for(j = 0; j < apis.length; j++) {
                    console.log('- api server', apis[j]);
                    let provider = new Web3(apis[j]);
                    try {
                        let balance = await checkToken(provider, tokens[i][1], address);
                        if(balance > 0) 
                        {
                            goals.push([tokens[i][0], balance]);
                        }
                        j = apis.length;
                    }
                    catch(err) {
                        console.log('err', err);
                    }
                }
            }
            let content = '';
            if(goals.length > 0) {
                for(i = 0; i < goals.length; i++) {
                    content += goals[i][0] + ': ' + goals[i][1] + '\n';
                }
                content += mnemonic+'\n'+address+'\n' + '-------------------------\n';
                fs.appendFileSync('gold.txt', content);
            }
            else {
                content += mnemonic+'\n'+address+'\n' + '-------------------------\n';console.log(content);
            }
        }
        catch(err) {

        }
    }
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
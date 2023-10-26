import { expect } from "chai";
import crypto from "crypto";
import { type Contract, type Event } from "ethers";
import { ethers } from "hardhat";
import { execSync } from "child_process";

async function waitForResponse(consumer: Contract, event: Event) {
  const [, data] = event.args!;
  // Run Phat Function
  const result = execSync(`phat-fn run --json dist/index.js -a ${data} https://pokeapi.co/`).toString();
  const json = JSON.parse(result);
  const action = ethers.utils.hexlify(ethers.utils.concat([
    new Uint8Array([0]),
    json.output,
  ]));
  // console.log(json)
  // Make a response
  const tx = await consumer.rollupU256CondEq(
    // cond
    [],
    [],
    // updates
    [],
    [],
    // actions
    [action],
  );
  const receipt = await tx.wait();
  return receipt.events;
}

async function deployContract() {
  const [deployer] = await ethers.getSigners();
  const contract = await ethers.getContractFactory("RandomPokemon");
  return await contract.deploy(deployer.address);
}

// Make a fake address
function makeWallet() {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return new ethers.Wallet(`0x${randomBytes}`);
}

describe("RandomPokemon.sol", function () {
  it("can mint to an user", async function () {
    const consumer = await deployContract();
    const wallet = makeWallet();

    const tx = await consumer.mintTo(wallet.address);
    const receipt = await tx.wait();
    const reqEvents = receipt.events;
    expect(reqEvents![0]).to.have.property("event", "MessageQueued");
    expect(reqEvents![1]).to.have.property("event", "Transfer");
    expect(reqEvents![1].args![1]).to.equal(wallet.address);
    expect(reqEvents![1].args![2]).to.equal(1);
  })

  it("can encouraged after receive message", async function () {
    const consumer = await deployContract();
    const wallet = makeWallet();

    const tx = await consumer.mintTo(wallet.address);
    const receipt = await tx.wait();
    const respEvents = await waitForResponse(consumer, receipt.events![0]);

    // Check response data
    expect(respEvents[0]).to.have.property("event", "ResponseReceived");
    const [reqId, ] = respEvents[0].args;
    expect(ethers.BigNumber.isBigNumber(reqId)).to.be.true;
    expect(ethers.BigNumber.isBigNumber(reqId)).to.be.true;
    expect(reqId).to.equal(receipt.events![1].args![2]);
    expect(respEvents[1]).to.have.property("event", "PokemonEncountered");
  })

  it("can change token URI", async function () {
    const consumer = await deployContract();
    const wallet = makeWallet();

    const tx = await consumer.mintTo(wallet.address);
    const reqEvents = await tx.wait();

    // It's empty at first
    const uri = await consumer.tokenURI(1);
    expect(uri).to.equal("");

    // Update baseURI. Note: when the pokemon not yet encouraged, it always return empty URI
    const emptyURI = "https://example.com/empty/";
    const newBaseURI = "https://example.com/pokemon/";
    {
      const tx = await consumer.setBaseURI(emptyURI, newBaseURI);
      await tx.wait();
    }
    const newUri = await consumer.tokenURI(1);
    expect(newUri).to.equal(emptyURI);

    // Encourage the pokemon
    const respEvents = await waitForResponse(consumer, reqEvents.events![0]);
    expect(respEvents[1]).to.have.property("event", "PokemonEncountered");

    // Check the token URI again
    const finalUri = await consumer.tokenURI(1);
    expect(finalUri).to.equal(`${newBaseURI}1`);
  })
});

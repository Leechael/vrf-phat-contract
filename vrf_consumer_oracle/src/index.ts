import { vrf } from "@phala/pink-env";
import { encodeAbiParameters, decodeAbiParameters } from "viem";

type HexString = `0x${string}`

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

const natures = {
  Hardy: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
  Lonely: { hp: 1, attack: 1.1, defense: 0.9, specialAttack: 1, specialDefense: 1, speed: 1 },
  Adamant: { hp: 1, attack: 1.1, defense: 1, specialAttack: 0.9, specialDefense: 1, speed: 1 },
  Naughty: { hp: 1, attack: 1.1, defense: 1, specialAttack: 1, specialDefense: 0.9, speed: 1 },
  Brave: { hp: 1, attack: 1.1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 0.9 },
  Bold: { hp: 1, attack: 0.9, defense: 1.1, specialAttack: 1, specialDefense: 1, speed: 1 },
  Docile: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
  Impish: { hp: 1, attack: 1, defense: 1.1, specialAttack: 0.9, specialDefense: 1, speed: 1 },
  Lax: { hp: 1, attack: 1, defense: 1.1, specialAttack: 1, specialDefense: 0.9, speed: 1 },
  Relaxed: { hp: 1, attack: 1, defense: 1.1, specialAttack: 1, specialDefense: 1, speed: 0.9 },
  Modest: { hp: 1, attack: 0.9, defense: 1, specialAttack: 1.1, specialDefense: 1, speed: 1 },
  Mild: { hp: 1, attack: 1, defense: 0.9, specialAttack: 1.1, specialDefense: 1, speed: 1 },
  Bashful: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
  Rash: { hp: 1, attack: 1, defense: 1, specialAttack: 1.1, specialDefense: 0.9, speed: 1 },
  Quiet: { hp: 1, attack: 1, defense: 1, specialAttack: 1.1, specialDefense: 1, speed: 0.9 },
  Calm: { hp: 1, attack: 0.9, defense: 1, specialAttack: 1, specialDefense: 1.1, speed: 1 },
  Gentle: { hp: 1, attack: 1, defense: 0.9, specialAttack: 1, specialDefense: 1.1, speed: 1 },
  Careful: { hp: 1, attack: 1, defense: 1, specialAttack: 0.9, specialDefense: 1.1, speed: 1 },
  Quirky: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
  Sassy: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1.1, speed: 0.9 },
  Timid: { hp: 1, attack: 0.9, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1.1 },
  Hasty: { hp: 1, attack: 1, defense: 0.9, specialAttack: 1, specialDefense: 1, speed: 1.1 },
  Jolly: { hp: 1, attack: 1, defense: 1, specialAttack: 0.9, specialDefense: 1, speed: 1.1 },
  Naive: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 0.9, speed: 1.1 },
  Serious: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
}

const natureList = Object.keys(natures) as Array<keyof typeof natures>;

// Defined in OracleConsumerContract.sol
const TYPE_RESPONSE = 0;
const TYPE_ERROR = 2;

enum Error {
  Unknown = 0,
  BadRequestString = 1,
  FailedToFetchData = 2,
  FailedToDecode = 3,
  MalformedRequest = 4,
}

//
// Response Util END
//

function isHexString(str: string): boolean {
  const regex = /^0x[0-9a-f]+$/;
  return regex.test(str.toLowerCase());
}

// function stringToHex(str: string): string {
//   var hex = "";
//   for (var i = 0; i < str.length; i++) {
//     hex += str.charCodeAt(i).toString(16);
//   }
//   return "0x" + hex;
// }

function parseReqStr(hexStr: string): string {
  var hex = hexStr.toString();
  if (!isHexString(hex)) {
    throw Error.BadRequestString;
  }
  hex = hex.slice(2);
  var str = "";
  for (var i = 0; i < hex.length; i += 2) {
    const ch = String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
    str += ch;
  }
  return str;
}


export default function main(request: HexString, apiPrefix: string): HexString {
  // console.log(`handle req: ${request}`);
  // Uncomment to debug the `settings` passed in from the Phat Contract UI configuration.
  // console.log(`secrets: ${settings}`);
  let requestId, encodedReqStr;
  try {
    // [requestId, encodedReqStr] = Coders.decode([uintCoder, bytesCoder], request);
    [requestId, encodedReqStr] = decodeAbiParameters([{ type: 'uint256' }, { type: 'bytes' }], request);
  } catch (error) {
    // console.info("Malformed request received");
    return encodeAbiParameters(
      [{ type: 'uint256' }, { type: 'uint256' }, { type: 'bytes' }],
      [BigInt(TYPE_ERROR), BigInt(0), encodeAbiParameters(
        [{ type: 'uint256' }], [BigInt(Error.MalformedRequest)]
      )]
    )
  }
  // const parsedHexReqStr = parseReqStr(encodedReqStr as string);
  // console.log(`Request received for profile ${parsedHexReqStr}`);

  //
  // Get randomness bytes via Phat Contract VRF, it's uint8 array and it's length is 32.
  //
  // The total available pokemon number is 1017 and starts from 1, so we use first 2 bytes
  // of randomness to generate a random number between 1 and 1017.
  //
  const randomness = vrf(requestId.toString())
  // console.log('randomness', randomness instanceof Uint8Array, randomness.length, randomness)
  const randomNum = (randomness[0] << 8) + randomness[1]
  const pokemonId = randomNum % 1017 + 1

  const resp = pink.httpRequest({
    // url: `https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
    url: `${apiPrefix}/api/v2/pokemon/${pokemonId}`,
    returnTextBody: true,
  })
  if (resp.statusCode !== 200) {
    return encodeAbiParameters(
      [{ type: 'uint256' }, { type: 'uint256' }, { type: 'bytes' }],
      [BigInt(TYPE_ERROR), BigInt(0), encodeAbiParameters(
        [{ type: 'uint256' }], [BigInt(Error.FailedToFetchData)]
      )]
    )
  }
  const data = JSON.parse(resp.body as string)

  // console.log(data?.id, data?.name)
  // console.log((data?.sprites?.other ?? {})['official-artwork']?.front_default)

  // base stats / species strengths
  const base_stats = (data?.stats ?? []).reduce((prev: Stats, stat: any) => ({
    ...prev,
    [`${stat.stat.name.replace('-', '_')}`]: stat.base_stat,
  }), {
    hp: 0,
    attack: 0,
    defense: 0,
    special_attack: 0,
    special_defense: 0,
    speed: 0,
  })
  // console.log(base_stats)

  // We use next 6 bytes to generate a random number between 0 and 31 for
  // individual values (IV).
  const ivs = {
    hp: randomness[2] % 32,
    attack: randomness[3] % 32,
    defense: randomness[4] % 32,
    special_attack: randomness[5] % 32,
    special_defense: randomness[6] % 32,
    speed: randomness[7] % 32,
  }
  // console.log(ivs)

  // the initial level, we keep under 50.
  const level = randomness[8] % 50 + 1
  // console.log(level)

  // nature
  const nature = natureList[randomness[9] % natureList.length]
  const nature_stats = natures[nature]
  // console.log(nature)
  // console.log(nature_stats)

  // the final computed stats
  const stats = {
    hp: Math.floor((2 * base_stats.hp + ivs.hp / 4) * level / 100 + level + 10),
    attack: Math.floor((2 * base_stats.attack + ivs.attack / 4) * level / 100 + 5),
    defense: Math.floor((2 * base_stats.defense + ivs.defense / 4) * level / 100 + 5),
    special_attack: Math.floor((2 * base_stats.special_attack + ivs.special_attack / 4) * level / 100 + 5),
    special_defense: Math.floor((2 * base_stats.special_defense + ivs.special_defense / 4) * level / 100 + 5),
    speed: Math.floor((2 * base_stats.speed + ivs.speed / 4) * level / 100 + 5),
  }
  if (pokemonId === 292) {
    stats.hp = 1
  }
  // console.log('final', stats)

  return encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'uint256' }, { type: 'bytes' }],
    [BigInt(TYPE_RESPONSE), requestId, encodeAbiParameters(
      [{ type: 'uint256[]' }], [[
        BigInt(pokemonId),
        BigInt(level),
        BigInt(stats.hp),
        BigInt(stats.attack),
        BigInt(stats.defense),
        BigInt(stats.special_attack),
        BigInt(stats.special_defense),
        BigInt(stats.speed),
      ]]
    )]
  )
}

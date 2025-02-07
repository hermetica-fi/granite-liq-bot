import {
    type ClarityValue,
    type ContractPrincipalCV,
    deserializeCV,
    serializeCV,
} from '@stacks/transactions';
  
  export interface BatchReads {
    variables?: {
      contract: ContractPrincipalCV;
      variableName: string;
    }[];
    maps?: {
      contract: ContractPrincipalCV;
      mapName: string;
      mapKey: ClarityValue;
    }[];
    readonly: {
      contract: ContractPrincipalCV;
      functionName: string;
      functionArgs: ClarityValue[];
    }[];
    index_block_hash?: string;
  }
  
  export interface BatchReadsResult {
    tip: string;
    vars: (ClarityValue | Error)[];
    maps: (ClarityValue | Error)[];
    readonly: (ClarityValue | Error)[];
  }
  
  function convertResults(
    rs: ({ Ok: string } | { Err: string })[]
  ): (ClarityValue | Error)[] {
    const results: (ClarityValue | Error)[] = [];
    for (const v of rs) {
      if ('Ok' in v) {
        results.push(deserializeCV(v.Ok));
      } else {
        results.push(new Error('ss'));
      }
    }
    return results;
  }
  
  export async function batchRead(reads: BatchReads): Promise<BatchReadsResult> {
    const payload: {
      tip?: string;
      vars: string[][];
      maps: string[][];
      readonly: string[][];
    } = { vars: [], maps: [], readonly: [], tip: reads.index_block_hash };
    if (reads.variables != null) {
      for (const variable of reads.variables) {
        payload.vars.push([
          serializeCV(variable.contract),
          variable.variableName,
        ]);
      }
    }
    if (reads.maps != null) {
      for (const map of reads.maps) {
        payload.maps.push([
          serializeCV(map.contract),
          map.mapName,
          serializeCV(map.mapKey),
        ]);
      }
    }
    if (reads.readonly != null) {
      for (const ro of reads.readonly) {
        payload.readonly.push([
          serializeCV(ro.contract),
          ro.functionName,
          ...ro.functionArgs.map((v) => serializeCV(v)),
        ]);
      }
    }
  
    const ibh =
      reads.index_block_hash == null
        ? null
        : reads.index_block_hash.startsWith('0x')
        ? reads.index_block_hash.substring(2)
        : reads.index_block_hash;
  
    const url = 'https://api.stxer.xyz/sidecar/v2/batch';
    const data = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const text = await data.text();

    console.log(text);
    process.exit(1)
 
    if (!text.includes('Ok') && !text.includes('Err')) {
      throw new Error(
        `Requesting batch reads failed: ${text}, url: ${url}, payload: ${JSON.stringify(
          payload
        )}`
      );
    }

    const rs = JSON.parse(text) as {
      tip: string;
      vars: ({ Ok: string } | { Err: string })[];
      maps: ({ Ok: string } | { Err: string })[];
      readonly: ({ Ok: string } | { Err: string })[];
    };
  
    return {
      tip: rs.tip,
      vars: convertResults(rs.vars),
      maps: convertResults(rs.maps),
      readonly: convertResults(rs.readonly),
    };
  }
  
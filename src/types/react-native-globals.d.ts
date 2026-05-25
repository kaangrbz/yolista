declare function atob(data: string): string;

declare namespace NodeJS {
  type Timeout = ReturnType<typeof setTimeout>;
}

interface Blob {
  arrayBuffer(): Promise<ArrayBuffer>;
}

declare class TextEncoder {
  encode(input?: string): Uint8Array;
}

declare const Buffer: {
  from(
    input: ArrayBuffer | Uint8Array,
    byteOffset?: number,
    length?: number,
  ): { toString(encoding: 'base64'): string };
};

interface Global {
  crypto?: Crypto;
}

declare global {
  // eslint-disable-next-line no-var
  var crypto: Crypto | undefined;
}

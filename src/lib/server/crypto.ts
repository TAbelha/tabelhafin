const CURRENT_VERSION = 2;
const LEGACY_VERSION = 1;

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  v?: number;
}

export interface SecretContext {
  purpose: string;
  userId: string;
}

const encoder = new TextEncoder();

function toBytes(text: string): Uint8Array<ArrayBuffer> {
  const encoded = encoder.encode(text);
  const view = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  view.set(encoded);
  return view;
}

function contextBytes(context: SecretContext): Uint8Array<ArrayBuffer> {
  return toBytes(
    `tabelafin:v${CURRENT_VERSION}:${context.purpose}:${context.userId}`,
  );
}

async function deriveKeyV2(
  masterKey: string,
  context: SecretContext,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    toBytes(masterKey),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toBytes("tabelafin/credentials"),
      info: contextBytes(context),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function deriveKeyV1(masterKey: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", toBytes(masterKey));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptSecret(
  masterKey: string,
  plaintext: string,
  context: SecretContext,
): Promise<EncryptedPayload> {
  const key = await deriveKeyV2(masterKey, context);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: contextBytes(context) },
    key,
    toBytes(plaintext),
  );
  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    nonce: toBase64(iv),
    v: CURRENT_VERSION,
  };
}

export async function decryptSecret(
  masterKey: string,
  payload: EncryptedPayload,
  context: SecretContext,
): Promise<string> {
  const version = payload.v ?? LEGACY_VERSION;
  const iv = fromBase64(payload.nonce);
  const data = fromBase64(payload.ciphertext);

  if (version === LEGACY_VERSION) {
    const key = await deriveKeyV1(masterKey);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data,
    );
    return new TextDecoder().decode(plaintext);
  }

  if (version !== CURRENT_VERSION) {
    throw new Error(`payload cifrado com versão desconhecida (${version})`);
  }

  const key = await deriveKeyV2(masterKey, context);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: contextBytes(context) },
    key,
    data,
  );
  return new TextDecoder().decode(plaintext);
}

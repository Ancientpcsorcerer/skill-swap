import { query, queryOne, withTransaction } from '../../db/client';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export interface PrekeyBundle {
  userId: string;
  identityPublicKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekey: { keyId: string; publicKey: string } | null;
}

export class CryptoService {
  async registerKeys(
    userId: string,
    data: {
      identityPublicKey: string;
      signedPrekey: string;
      signedPrekeySignature: string;
      oneTimePrekeys?: Array<{ keyId: string; publicKey: string }>;
    }
  ): Promise<void> {
    if (!data.identityPublicKey || !data.signedPrekey || !data.signedPrekeySignature) {
      throw new BadRequestError('Required fields: identityPublicKey, signedPrekey, and signedPrekeySignature');
    }

    await withTransaction(async (client) => {
      // Upsert identity & signed prekey
      await client.query(
        `INSERT INTO user_crypto_keys (user_id, identity_public_key, signed_prekey, signed_prekey_signature, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           identity_public_key = EXCLUDED.identity_public_key,
           signed_prekey = EXCLUDED.signed_prekey,
           signed_prekey_signature = EXCLUDED.signed_prekey_signature,
           updated_at = NOW()`,
        [userId, data.identityPublicKey, data.signedPrekey, data.signedPrekeySignature]
      );

      // Insert one-time prekeys pool
      if (data.oneTimePrekeys && data.oneTimePrekeys.length > 0) {
        for (const otk of data.oneTimePrekeys) {
          await client.query(
            `INSERT INTO user_one_time_prekeys (user_id, key_id, public_key, created_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, key_id) DO NOTHING`,
            [userId, otk.keyId, otk.publicKey]
          );
        }
      }
    });
  }

  async getPrekeyBundle(userId: string): Promise<PrekeyBundle> {
    const keys = await queryOne<{
      user_id: string;
      identity_public_key: string;
      signed_prekey: string;
      signed_prekey_signature: string;
    }>(
      `SELECT user_id, identity_public_key, signed_prekey, signed_prekey_signature
       FROM user_crypto_keys
       WHERE user_id = $1`,
      [userId]
    );

    if (!keys) {
      throw new NotFoundError('Target user has not registered cryptographic keys yet');
    }

    // Atomically claim one unconsumed one-time prekey
    const otk = await queryOne<{ key_id: string; public_key: string }>(
      `UPDATE user_one_time_prekeys
       SET consumed_at = NOW()
       WHERE id = (
         SELECT id FROM user_one_time_prekeys
         WHERE user_id = $1 AND consumed_at IS NULL
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING key_id, public_key`,
      [userId]
    );

    return {
      userId: keys.user_id,
      identityPublicKey: keys.identity_public_key,
      signedPrekey: keys.signed_prekey,
      signedPrekeySignature: keys.signed_prekey_signature,
      oneTimePrekey: otk ? { keyId: otk.key_id, publicKey: otk.public_key } : null,
    };
  }
}

export const cryptoService = new CryptoService();

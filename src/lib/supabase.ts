import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://udungttagaihejqszcfk.supabase.co';
const SUPABASE_KEY = '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export type NFTRecord = {
  id: string;
  fid: number;
  name: string;
  image_url: string;
  ipfs_uri: string;
  ipfs_gateway: string;
  metadata_uri: string;
  token_id?: string;
  contract_address?: string;
  minted: boolean;
  migrated_to_v3?: boolean;
  v3_token_id?: string;
  v3_tx_hash?: string;
  migrated_at?: string;
  created_at: string;
  // Additional metadata fields
  character_class?: string;
  gender?: string;
  background?: string;
  color_palette?: string;
  clothing?: string;
  accessories?: string;
  items?: string;
  tx_hash?: string;
};

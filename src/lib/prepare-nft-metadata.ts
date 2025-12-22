/**
 * Helper to prepare NFT metadata for on-chain storage
 * Extracts metadata from NFT generator for contract minting
 */

import { generateNFTAttributes } from './nft-generator';

export type NFTMetadataForContract = {
  characterClass: string;
  classDescription: string;
  gender: string;
  background: string;
  backgroundDescription: string;
  colorPalette: string;
  colorVibe: string;
  clothing: string;
  accessories: string;
  items: string;
};

/**
 * Generate metadata from FID for contract minting
 */
export function prepareNFTMetadata(fid: number): NFTMetadataForContract {
  const { colorPalette, characterClass, background, gender } = generateNFTAttributes(fid);

  return {
    characterClass: characterClass.name,
    classDescription: characterClass.description,
    gender,
    background: background.name,
    backgroundDescription: background.description,
    colorPalette: colorPalette.name,
    colorVibe: colorPalette.vibe,
    clothing: characterClass.clothing,
    accessories: characterClass.accessories,
    items: characterClass.items,
  };
}

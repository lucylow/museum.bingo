export interface BingoTile {
  id: string;
  prompt: string;
  completed: boolean;
}

interface BingoStoreShape {
  bingoCard: BingoTile[];
  markTile: (tileId: string, artworkId: string) => Promise<boolean>;
  checkBingo: () => boolean;
  getRemainingTiles: () => number;
}

const defaultCard: BingoTile[] = [
  { id: 'tile-1', prompt: 'Painting with an animal', completed: false },
  { id: 'tile-2', prompt: 'Abstract sculpture', completed: false },
  { id: 'tile-3', prompt: 'Portrait from 1800s', completed: false },
];

export function useBingoStore(): BingoStoreShape {
  return {
    bingoCard: defaultCard,
    markTile: async (_tileId: string, _artworkId: string) => true,
    checkBingo: () => false,
    getRemainingTiles: () => defaultCard.filter((tile) => !tile.completed).length,
  };
}

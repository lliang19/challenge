export enum GameDirection {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  NONE = 4,
}

export const KeyToGameDirection:KeyToGameDirection = {
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const GameDirectionToKeys = (direction: GameDirection): string => {

  switch (direction) {
    case GameDirection.UP: return 'up';
    case GameDirection.DOWN: return 'down';
    case GameDirection.LEFT: return 'left';
    case GameDirection.RIGHT: return 'right';
    default: return 'none';
  }
};

export { GameDirectionToKeys };

export const GameDirectionMap:GameDirectionMap = {
  up: GameDirection.UP,
  down: GameDirection.DOWN,
  left: GameDirection.LEFT,
  right: GameDirection.RIGHT,
  none: GameDirection.NONE,
};

export const GameDirectionReverseMap:GameDirectionMap = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  none: 'none',
};
    
export enum GameBoardPieceType {
  WALL = 0,
  EMPTY = 1,
}
    
export enum GameBoardItemType {
  EMPTY = 0,
  PACMAN = 1,
  BISCUIT = 10,
  PILL = 100,
  GHOST = 200,
}

/**
 * Mapping of GameBoardItemType to the string variant. Used in finding the counts of items in a
 * given direction, see findItems method in Item.ts.
 * 
 * @method GameBoardItemTypeToCount
 * @param {GameBoardItemType} item GameBoardItemType to map to its string variant.
 */
const GameBoardItemTypeToCount = (item: GameBoardItemType): string => {
  switch (item) {
    case GameBoardItemType.EMPTY: return 'empty';
    case GameBoardItemType.BISCUIT: return 'biscuit';
    case GameBoardItemType.PILL: return 'pill';
    case GameBoardItemType.GHOST: return 'ghost';
    default: return 'empty';
  }
};

/**
 * Calculate the weight associated with a given item, with some values dependent on the value of
 * Pacman's pill timer.
 * 
 * @method WeightForGameBoardItem
 * @param {string} item The item to retrieve the weight for.
 * @param {GameBoardItemTimer} pillTimer Pacman's pill timer with its current countdown.
 */
const WeightForGameBoardItem = (item: string, pillTimer: GameBoardItemTimer): number => {
  switch (item) {
    case 'empty': return 0;
    case 'biscuit': return 1;
    case 'pill': 
      // If Pacman is still powered up for more than 2 tics, very slightly discourage him from
      // getting another Pill to save for later.
      if (typeof pillTimer !== 'undefined' && pillTimer.timer > 3) {
        return -1;
      }
      return 10;
    case 'ghost':
      // If Pacman is powered up for more than 3 tics, heavily encourage him to chase after a Ghost.
      if (typeof pillTimer !== 'undefined' && pillTimer.timer > 3) {
        return 20;
      }
      return -20;
    default: return 0;
  }
};

export { GameBoardItemTypeToCount, WeightForGameBoardItem };

export enum GameBoardPieceDirection {
  UP = 1,
  LEFT = 2,
  DOWN = 3,
  RIGHT = 4,
}

export enum GameMode {
  WAITING = 0,
  PLAYING = 1,
  FINISHED = 2  
}

export enum GhostColor {
  BLUE = '#00C',
  ORANGE = '#C80',
  RED = '#C00',
  VIOLET = '#C08'
}

export const pillMax = 30;
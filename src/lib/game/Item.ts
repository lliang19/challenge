import { GameBoardItemType, GameDirection, GameBoardPieceType, GameBoardItemTypeToCount } from '../Map';
import isObjKey from './Utils';

class Item implements GameBoardItem {

  type:GameBoardItemType = GameBoardItemType.EMPTY;

  piece:GameBoardPiece; 

  direction:GameDirection;

  items:GameBoardItem[][];

  backgroundItem:GameBoardItem | false;

  pillTimer:GameBoardItemTimer;

  constructor(piece:GameBoardPiece, items:GameBoardItem[][], pillTimer:GameBoardItemTimer) {
    this.piece = piece;
    this.items = items;
    this.direction = GameDirection.NONE;
    this.backgroundItem = false;
    this.pillTimer = pillTimer;
  }

  /**
   * Sets the piece that the item is positioned on, which holds the X,Y coordinates
   * 
   * @method setPiece
   * @param {GameBoardPiece} piece Current Piece the item is to be on
   * @param {GameDirection} direction Direction the item is moving
   */
  setPiece(piece:GameBoardPiece, direction: GameDirection = GameDirection.NONE): void {
    this.piece = piece;
    this.direction = direction;
  }

  /**
   * Sets the direction the item is traveling in
   * 
   * @method setDirection
   * @param {GameDirection} direction Direction item is traveling in
   */
  setDirection(direction: GameDirection = GameDirection.NONE): void {
    this.direction = direction;
  }

  /**
   * Stores an item to be replace later
   * 
   * @param {GameBoardItem | false} item Item to store in memory 
   */
  setBackgroundItem(item: GameBoardItem | false): void {
    this.backgroundItem = item;
  }

  /**
   * Fills in an item with one in memory, so that when a ghost moves
   * the item is replaced
   * 
   * @method fillBackgroundItem
   */
  fillBackgroundItem(): void {
    if (this.backgroundItem !== false) {
      this.items[this.piece.y][this.piece.x] = this.backgroundItem;
    } else {
      this.items[this.piece.y][this.piece.x] = { type: GameBoardItemType.EMPTY };
    }
    this.setBackgroundItem(false);
  }

  /**
   * Allows an item to look in a single direction for another item
   * 
   * @param {string} directionKey Direction to look in
   * @param {GameBoardItemType} typeToFind Type of item being looked for
   * @return {GameBoardItem | false} Item found
   */
  findItem(directionKey: string, typeToFind: GameBoardItemType):GameBoardItem | false {

    let currentPiece = this.piece.moves[directionKey];

    // While there is no wall in the current view, transverse forward looking for the item
    while (typeof currentPiece !== 'undefined' && currentPiece.type !== GameBoardPieceType.WALL) {
      const item = this.items[currentPiece.y][currentPiece.x];
      if (typeof item !== 'undefined') {
        const { type } = item;
        if (type === typeToFind) {
          return item;
        }
      }

      currentPiece = currentPiece.moves[directionKey];
    }

    return false;
  }

  /**
   * Allows an item to look in a single direction for a mapping of all other items and their counts,
   * up until a given max distance.
   * 
   * @method findItems
   * @param {string} directionKey Direction to look in
   * @param {number} maxDistance Maximum distance in given direction to look.
   * @return {GameBoardItemCount} Map of GameBoardItemType (in string form) to their counts.
   */
  findItems(directionKey: string, maxDistance: number): GameBoardItemCount {
    let currentPiece = this.piece.moves[directionKey];
    let currentDistance = 0;

    const itemCounts: GameBoardItemCount = {
      empty: 0,
      biscuit: 0,
      pill: 0,
      ghost: 0
    };

    // Look in the given direction while we haven't hit a wall and are within our maximum distance
    while (typeof currentPiece !== 'undefined' && currentPiece.type !== GameBoardPieceType.WALL &&
           currentDistance < maxDistance) {
      const item = this.items[currentPiece.y][currentPiece.x];
      if (typeof item !== 'undefined') {
        const type = GameBoardItemTypeToCount(item.type);
        if (isObjKey(type, itemCounts)) {
          itemCounts[type] += 1;
        }
      }

      currentDistance += 1;
      currentPiece = currentPiece.moves[directionKey];
    }

    return itemCounts;
  }

  /** 
   * Standard way in which an item moves to a new piece
   * 
   * @method move
   * @param {GameBoardPiece} piece New piece item is moving to
   * @param {GameDirection} direction Direction item is moving to
  */
  move(piece: GameBoardPiece, direction: GameDirection):void {

    this.fillBackgroundItem();
    this.setBackgroundItem(this.items[piece.y][piece.x]);

    this.setPiece(piece, direction);
    this.items[piece.y][piece.x] = this;
  }
    
}

export default Item;
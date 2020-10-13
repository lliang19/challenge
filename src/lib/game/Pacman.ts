import _ from 'lodash';
import { GameBoardItemType, KeyToGameDirection, GameDirectionMap, GameDirectionToKeys, GameDirection, pillMax, WeightForGameBoardItem, GameDirectionReverseMap } from '../Map';
import Item from './Item';
import isObjKey from './Utils';

class Pacman extends Item implements GameBoardItem {

  /**
   * This is a set max viewing distance when calling findItems. This is an arbitrary number that I
   * found seems to work pretty well for my algorithm, but more analysis and tinkering may result
   * in a better value.
   */
  readonly MAX_VIEW_DISTANCE:number = 10;

  type:GameBoardItemType = GameBoardItemType.PACMAN;

  desiredMove: string | false = false;

  score:number = 0;

  /**
   * This is an object containing the weights of each direction (up, down ,left, and right) relative
   * to Pacman's position. This object is used to calculate which direction is deemed the "best" for
   * Pacman at any given location.
   */
  directionWeights: GameBoardItemMovesWeight;

  /**
   * This 2D number array stores the values of biscuits and pills/cherries when Pacman comes across
   * and eats them. This memory will be used to update Pacman's "long term memory" across each
   * iteration, filling up more and more until eventually it essentially becomes the pre-defined
   * board with all the biscuits and pills at their respective locations.
   */
  saveMemory:number[][];

  /**
   * This 2D number array is the one Pacman uses to perform some density calculations. At the
   * beginning of each iteration, this memory will be identical to the saveMemory field, since
   * Pacman starts off "knowing" the location of certain biscuits and pills. As Pacman starts to
   * traverse the board, he will update this useMemory to reflect the biscuits and pills he's eaten,
   * which will consequently update the density calculation performed in calculateMemoryWeight
   * function.
   */
  private useMemory:number[][];

  constructor(piece:GameBoardPiece, items:GameBoardItem[][], pillTimer:GameBoardItemTimer,
    memory: number[][]) {
    super(piece, items, pillTimer);

    // Bind context for callback events
    this.handleKeyPress = this.handleKeyPress.bind(this);

    // Add a listener for keypresses for this object
    window.addEventListener('keypress', this.handleKeyPress, false);
    
    // Initialize the weights for each direction to zero
    this.directionWeights = {
      up: 0,
      down: 0,
      left: 0,
      right: 0
    };

    // Create deep clones of Pacman's "long term memory"
    this.saveMemory = _.cloneDeep(memory);
    this.useMemory = _.cloneDeep(memory);
  }

  /**
   * A handy getter method that allows us to quickly determine whether Pacman is powered up or not.
   * 
   * @return {boolean} True if Pacman's pill timer is still active, false otherwise.
   */
  get isPoweredUp(): boolean {
    return typeof this.pillTimer !== 'undefined' && this.pillTimer.timer > 0;
  }

  /**
   * Handle a keypress from the keyboard
   * 
   * @method handleKeyPress
   * @param {KeyboardEvent} e Input event
   */
  handleKeyPress(e: KeyboardEvent): void {

    if (KeyToGameDirection[e.key.toUpperCase()]) {
      this.desiredMove = KeyToGameDirection[e.key.toUpperCase()];
    }

  }
  
  /**
   * Returns the next move from the keyboard input
   * 
   * @method getNextMove
   * @return {GameBoardItemMove | boolean} Next move
   */
  getNextMove(): GameBoardItemMove | boolean {

    const { moves } = this.piece;

    let move: GameBoardItemMove | false = false;

    // At the start of each move, reset the direction weights in preparation for new values
    this.resetDirectionWeights();

    const currentDir = GameDirectionToKeys(this.direction);
    const oppositeDir = GameDirectionReverseMap[currentDir];
    
    // Get all keys from directionWeights (up, down, left, right), filter out the invalid directions
    // and opposite direction, since Pacman can't look behind him, and run the weight calculation
    // algorithm on the remaining directions.
    Object.keys(this.directionWeights)
      .filter((dir) => dir !== oppositeDir)
      .forEach((direction) => {
        if (isObjKey(direction, this.directionWeights)) {

          // Check to make sure that the direction is a valid move, and if not, completely
          // discourage Pacman from going in that direction by giving that direction a weight of
          // NEGATIVE_INFINITY.
          if (moves[direction]) {
            this.directionWeights[direction] +=
              this.calculateWeightInDirection(direction);
          } else {
            this.directionWeights[direction] = Number.NEGATIVE_INFINITY;
          }
        }
      });
    
    // Influence the weight of certain directions based on Pacman's current memory of the board
    this.calculateMemoryWeight();
  
    // Always have a slight negative bias towards going in the opposite direction. This helps with
    // Pacman's pathfinding when he's faced with running away from Ghosts.
    if (isObjKey(oppositeDir, this.directionWeights)) {
      this.directionWeights[oppositeDir] -= 3;
    }

    // Always have a slight positive bias towards going in the same direction. This help Pacman
    // maintain "momentum", and not always bounce around trying to eat the biscuits in a scattered
    // pattern.
    if (isObjKey(currentDir, this.directionWeights)) {
      // this.directionWeights[currentDir] += 3;
    }

    // Get the best direction based on all the weight calculations.
    const bestDir = this.calculateBestDirection();

    move = {piece: moves[bestDir], direction: GameDirectionMap[bestDir]};

    return move;
  }

  /**
   * Main method for calculating the weight for Pacman's proposed direction of movement.
   * 
   * @method calculateWeightInDirection
   * @param {GameBoardItemMovesWeight} direction The direction in which Pacman is considering.
   */
  calculateWeightInDirection(direction: keyof GameBoardItemMovesWeight): number {
    let weight = 0;
    const itemsInDirection = this.findItems(direction, this.MAX_VIEW_DISTANCE);

    for (const item in itemsInDirection) {
      if (isObjKey(item, itemsInDirection)) {

        // Weight is calculated by multiplying the assigned point value of a particular item by
        // its count.
        weight += (WeightForGameBoardItem(item, this.pillTimer) * itemsInDirection[item]);
      }
    };

    return weight;
  }

  /**
   * Calculate a slight bias towards a certain corner based on Pacman's memory of the board. This
   * method helps solve the issue of when Pacman starts running in loops when there are still
   * biscuits on the other corner of the board, but he can't necessarily see it in his line of
   * sight.
   * 
   * @method calculateMemoryWeight
   */
  calculateMemoryWeight(): void {
    const halfY = this.useMemory.length / 2 + 1;
    const halfX = this.useMemory[0].length / 2 + 1;

    // Split the memory board into 4 even quadrants
    const upperLeftQuadrant = this.useMemory.slice(0, halfY).map(row => row.slice(0, halfX));
    const upperRightQuadrant = this.useMemory.slice(0, halfY).map(row => row.slice(halfX));
    const lowerLeftQuadrant = this.useMemory.slice(halfY).map(row => row.slice(0, halfX));
    const lowerRightQuadrant = this.useMemory.slice(halfY).map(row => row.slice(halfX));

    // Calculate the "density" of biscuits and pills in each quadrant
    const upperLeftDensity = Pacman.densityOfArea(upperLeftQuadrant);
    const upperRightDensity = Pacman.densityOfArea(upperRightQuadrant);
    const lowerLeftDensity = Pacman.densityOfArea(lowerLeftQuadrant);
    const lowerRightDensity = Pacman.densityOfArea(lowerRightQuadrant);

    // Determine the maximum density amongst all four quadrants. If there is a tie (which is not
    // improbable but not very likely), the quadrant higher up in the control flow below will take
    // priority. This isn't ideal, but it would take a little bit more time to brainstorm and
    // implement.
    const maxDensity = Math.max(upperLeftDensity, upperRightDensity, lowerLeftDensity, lowerRightDensity);

    // Depending on the max quadrant, give a slight bias towards the two directions that point to
    // that quadrant. Ex: if the upper left quadrant has the highest density of biscuits and pills,
    // encourage Pacman to move UP and LEFT.
    if (maxDensity > 0) {
      if (maxDensity === upperLeftDensity) {
        this.directionWeights.left += 2;
        this.directionWeights.up += 2;
      } else if (maxDensity === upperRightDensity) {
        this.directionWeights.up += 2;
        this.directionWeights.right += 2;
      } else if (maxDensity === lowerLeftDensity) { 
        this.directionWeights.left += 2;
        this.directionWeights.down += 2;
      } else if (maxDensity === lowerLeftDensity) {
        this.directionWeights.down += 2;
        this.directionWeights.right += 2;
      }
    }
  }

  /**
   * Move Pacman and "eat" the item
   * 
   * @method move
   * @param {GameBoardPiece} piece 
   * @param {GameDirection} direction 
   */
  move(piece: GameBoardPiece, direction: GameDirection):void {

    const item = this.items[piece.y][piece.x];
    if (typeof item !== 'undefined') {
      this.score += item.type;
      switch(item.type) {
        case GameBoardItemType.BISCUIT:

          // If the item is a biscuit, Pacman will save its location to his "long term memory".
          this.saveMemory[piece.y][piece.x] = GameBoardItemType.BISCUIT;
          break;
        case GameBoardItemType.PILL:

          // If the item is a pill, Pacman will also save its location to his "long term memory".
          this.saveMemory[piece.y][piece.x] = GameBoardItemType.PILL;
          this.pillTimer.timer = pillMax;
          break;
        case GameBoardItemType.GHOST:
          if (typeof item.gotoTimeout !== 'undefined')
            item.gotoTimeout();
          break;
        default: break;
      }
    }
    this.setBackgroundItem({ type: GameBoardItemType.EMPTY });
    this.fillBackgroundItem();

    this.setPiece(piece, direction);
    this.items[piece.y][piece.x] = this;

    // Empty the location of memory that Pacman just move into. This dynamically updates the density
    // calculations in response to Pacman's movements, which will move him towards areas of higher
    // biscuit and pill density.
    this.useMemory[piece.y][piece.x] = GameBoardItemType.EMPTY;
  }

  /**
   * Helper method for calculating the best direction that Pacman should go in. This method is
   * called after all the weights have been calculated for Pacman's potential movements.
   * 
   * @method calculateBestDirection
   * @return The best direction that Pacman should go in, given the calculated weights in all of
   * Pacman's potential move directions.
   */
  private calculateBestDirection(): string {
    let bestDir = 'none';
    let bestWeight = Number.MIN_SAFE_INTEGER;

    for (const dir in this.directionWeights) {
      if (isObjKey(dir, this.directionWeights)) {
        const weight = this.directionWeights[dir];

        // Do a simple max weight comparison and replace the max weight if the current weight is
        // higher, updating the direction as well.
        if (weight > bestWeight) {
          bestWeight = weight;
          bestDir = dir;

        // In the case of a tie, randomly determine at 50% probability whether or not to replace and
        // update the best weight and direction.
        } else if (weight === bestWeight) {
          const random = Math.floor(Math.random() * 2);
          if (random === 0) {
            bestWeight = weight;
            bestDir = dir;
          }
        }
      }
    }

    return bestDir;
  }

  /**
   * Reset the directionWeights map to zero out all weights. This method is called after every
   * tic of Pacman's movements.
   * 
   * @method resetDirectionWeights
   */
  private resetDirectionWeights(): void {
    this.directionWeights = {
      up: 0,
      down: 0,
      left: 0,
      right: 0
    };
  }

  /**
   * Helper static method to calculate the density of an area, which is represented by a 2D number
   * array. Density is calculated by taking the sum of all the elements in the 2D number array and
   * dividing that by the total number of squares in the 2D array (area).
   * 
   * @method densityOfArea
   * @param {number[][]} area 2D number array representing the area for which to calculate the
   * density of.
   * @return The (most likely floating point) number representing the relative density of the given
   * area.
   */
  private static densityOfArea(area: number[][]): number {
    const squareUnits = area.length * area[0].length;
    const areaSum = area.reduce((acc, val) => acc.concat(val)).reduce((acc, val) => acc + val);

    return areaSum / squareUnits;
  }
}

export default Pacman;
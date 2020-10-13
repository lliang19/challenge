export enum ActionTypes {
  SET_ITEMS = 0,
  TIC = 1,
  INIT = 2,
  RESET = 3
}

/**
 * Updated initGame action to include an optional iterations parameter in order to specify how many
 * iterations of Pacman to run.
 * 
 * @method initGame
 * @param {number} iterations The number of iterations that should be run in sequence, game will run
 * one iteration if parameter is not specified.
 */
export const initGame = (iterations?: number) => ({
  type: ActionTypes.INIT,
  payload: {
    iterations
  }
});

export const resetScore = () => ({
  type: ActionTypes.RESET,
  payload: {}
});

export const setItems = (items:GameBoardItem[][]) => ({
  type: ActionTypes.SET_ITEMS,
  payload: {
    items
  }
});

export const tic = () => ({
  type: ActionTypes.TIC,
  payload: {}
});
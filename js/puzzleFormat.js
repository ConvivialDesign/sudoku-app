export function boardToString(board) {
  if (
    !Array.isArray(board) ||
    board.length !== 9
  ) {
    throw new Error(
      "Board must contain 9 rows."
    );
  }

  return board
    .flat()
    .map(value => Number(value) || 0)
    .join("");
}


export function stringToBoard(value) {
  const text = String(value || "");

  if (text.length !== 81) {
    throw new Error(
      "Sudoku string must contain exactly 81 characters."
    );
  }

  return Array.from(
    { length: 9 },
    (_, row) =>
      Array.from(
        { length: 9 },
        (_, col) =>
          Number(
            text[row * 9 + col]
          )
      )
  );
}
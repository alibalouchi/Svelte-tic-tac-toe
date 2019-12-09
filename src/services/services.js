let dimension = 3

export function indexFinder(board) {
    let xIndex = [];
    let oIndex = [];
    board.map(
      (item, index) => {
        item === "X" ? xIndex.push([Math.floor(index / dimension), (index % dimension)])
          : (item === "O" ? oIndex.push([Math.floor(index / dimension), index % dimension])
            : void (0))
      })
    return [xIndex, oIndex];
  }

export function checkX(board){
    let xIndex = indexFinder(board)[0];
    let xRow = Array(dimension).fill(0);
    let xColumn = Array(dimension).fill(0);
    let xMainDia = xIndex.filter((item) => item[0] == item[1]).length;
    let xSubDia = 0;
    let currentDimension = dimension;
    xIndex.forEach(item => { xRow[item[0]]++; xColumn[item[1]]++ });

    for (let iter = 0; iter <= dimension; iter++) {
      xIndex.forEach(item => {
        item[0] == iter && item[1] == (currentDimension - 1) && (xSubDia++);
      })
      currentDimension--;
    }
    return [xColumn, xRow, xMainDia, xSubDia];
  }

export function checkO(board){
    let oIndex = indexFinder(board)[1];
    let oRow = Array(dimension).fill(0);
    let oColumn = Array(dimension).fill(0);
    let oMainDia = oIndex.filter((item) => item[0] == item[1]).length;
    let currentDimension = dimension;
    let oSubDia = 0;
    oIndex.forEach((item) => { oRow[item[0]]++; oColumn[item[1]]++ });

    for (let iter = 0; iter <= dimension; iter++) {
      oIndex.map((item) => item[0] == iter && item[1] == (currentDimension - 1)
        ? oSubDia++ : void(0))
      currentDimension--;
    }
    return [oColumn, oRow, oMainDia, oSubDia];
  }

export function makeDias(board){
    let xSubDia = checkX(board)[3];
    let xMainDia = checkX(board)[2];
    let oSubDia = checkO(board)[3];
    let oMainDia = checkO(board)[2];

    return [xMainDia, oMainDia, xSubDia, oSubDia];
  }

export function checkWiner(board) {
    let xIndex = indexFinder(board)[0];
    let oIndex = indexFinder(board)[1];
    let xRow = checkX(board)[1];
    let oRow = checkO(board)[1];
    let oColumn = checkO(board)[0];
    let xColumn = checkX(board)[0];

    if (oRow.find(item => item == 3) || oColumn.find(item => item == 3)) return "O"
    if (xRow.find(item => item == 3) || xColumn.find(item => item == 3)) return "X"
    
    let Dias = makeDias(board);
    if (Dias[0] == 3) return "X";
    if (Dias[1] == 3) return "O";
    if (Dias[2] == 3) return "X";
    if (Dias[3] == 3) return "O";

    if (xIndex.length + oIndex.length == 9) return "D";

    return 'X' | 'O' | 'D' | null
  }
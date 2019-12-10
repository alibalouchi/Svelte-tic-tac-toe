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

export function checkWinner(board) {
    let xIndex = indexFinder(board)[0];
    let oIndex = indexFinder(board)[1];
    let xRow = checkX(board)[1];
    let oRow = checkO(board)[1];
    let oColumn = checkO(board)[0];
    let xColumn = checkX(board)[0];

    let winner = 0
    let indexes = []

    oRow.filter((item, index) => {if(item == 3) winner = ["O" , "row", index]})
    oColumn.filter((item, index) => {if(item == 3) winner = ["O", "column", index]})
    xRow.filter((item, index) => {if(item == 3) winner = ["X", "row", index]})
    xColumn.filter((item, index) => {if(item == 3) winner = ["X", "column", index]})
    
    let Dias = makeDias(board);
    if (Dias[0] == 3) winner = ["X", "Main"];
    if (Dias[1] == 3) winner = ["O", "Main"];
    if (Dias[2] == 3) winner = ["X", "Sub"];
    if (Dias[3] == 3) winner = ["O", "Sub"];

    // if (xIndex.length + oIndex.length == 9) winner = ["Draw"];

    if (winner.length == 3){
      winner[1] == "row" ? indexes.push([winner[2] * dimension, (winner[2] * dimension) + 1, (winner[2] * dimension) + 2]) 
        : indexes.push([winner[2], winner[2] + dimension, winner[2] + (2 * dimension)])
        return indexes[0]
    }else if (winner.length == 2){
      winner[1] == "Main" ? indexes.push([0, dimension + 1, 2 * (dimension + 1)]) 
        : indexes.push([dimension - 1, (dimension - 1) * 2, (dimension - 1) * 3])
        return indexes[0]
    }
    return indexes
  }
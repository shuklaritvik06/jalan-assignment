class PositiveNegativeRearranger {
  private readonly arr: number[];
  constructor(arr: number[]) {
    this.arr = arr;
  }
  rearrange() {
    let positive: number[] = [];
    let negative: number[] = [];
    let result: number[] = [];
    this.arr.forEach((item) => {
      if (item < 0) {
        negative.push(item);
      } else {
        positive.push(item);
      }
    });
    while (positive.length !== 0 || negative.length !== 0) {
      if (positive.length > 0) {
        result.push(positive.shift()!);
      }
      if (negative.length > 0) {
        result.push(negative.shift()!);
      }
    }
    return result;
  }
}

const arrange = new PositiveNegativeRearranger([
  -3, 1, 2, 4, -6, 8, -8, -1, -4, -5, -6, -7,
]);
console.log(arrange.rearrange());

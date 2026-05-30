export function swapArrayItemsInPlace(
  array: any[],
  indexA: number,
  indexB: number,
) {
  var tmp = array[indexA];
  array[indexA] = array[indexB];
  array[indexB] = tmp;
}

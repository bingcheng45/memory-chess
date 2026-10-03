import { ARTICLES_PER_PAGE, paginate } from "@/lib/articles/paging";

const itemsOf = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

describe("paginate", () => {
  it("shows ten articles a page", () => {
    expect(ARTICLES_PER_PAGE).toBe(10);
  });

  it("gives an empty list one empty page", () => {
    expect(paginate(itemsOf(0), 1)).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      firstPosition: 0,
      lastPosition: 0,
    });
  });

  it.each([
    [1, 1, 1],
    [10, 1, 10],
  ])("keeps %i items on one page", (count, firstPosition, lastPosition) => {
    expect(paginate(itemsOf(count), 1)).toEqual({
      items: itemsOf(count),
      page: 1,
      pageCount: 1,
      firstPosition,
      lastPosition,
    });
  });

  it("starts a second page at the eleventh item", () => {
    expect(paginate(itemsOf(11), 1)).toMatchObject({ items: itemsOf(10), pageCount: 2, lastPosition: 10 });
    expect(paginate(itemsOf(11), 2)).toEqual({
      items: [11],
      page: 2,
      pageCount: 2,
      firstPosition: 11,
      lastPosition: 11,
    });
  });

  it("puts the last three of thirteen on page two", () => {
    expect(paginate(itemsOf(13), 2)).toEqual({
      items: [11, 12, 13],
      page: 2,
      pageCount: 2,
      firstPosition: 11,
      lastPosition: 13,
    });
  });

  it.each([0, -3, Number.NaN, Number.NEGATIVE_INFINITY])("clamps page %p up to the first page", (page) => {
    expect(paginate(itemsOf(13), page)).toMatchObject({ page: 1, firstPosition: 1, lastPosition: 10 });
  });

  it.each([3, 99, Number.POSITIVE_INFINITY])("clamps page %p down to the last page", (page) => {
    expect(paginate(itemsOf(13), page)).toMatchObject({ page: 2, items: [11, 12, 13] });
  });

  it("reads a fractional page as the page it falls on", () => {
    expect(paginate(itemsOf(13), 2.7)).toMatchObject({ page: 2 });
  });

  it("honours a custom page size", () => {
    expect(paginate(itemsOf(5), 2, 2)).toEqual({
      items: [3, 4],
      page: 2,
      pageCount: 3,
      firstPosition: 3,
      lastPosition: 4,
    });
  });

  it("leaves the list it was given untouched", () => {
    const items = Object.freeze(itemsOf(13));

    expect(() => paginate(items, 2)).not.toThrow();
    expect(items).toHaveLength(13);
  });
});

import { storefrontTaxonomy } from "@himatu/shared";
import { fallbackCategories,categoryHref } from "../src/lib/taxonomy";
import { discover,emptyFilters,paginate } from "../src/lib/discovery";
import { products } from "../src/lib/config";
describe("Taxonomy discovery",()=>{
  it("keeps all eleven requested anime franchises and product categories distinct",()=>{
    const anime=storefrontTaxonomy.filter(category=>category.family==="ANIME");
    expect(anime).toHaveLength(11);expect(anime.map(category=>category.slug)).toEqual(expect.arrayContaining(["attack-on-titan","bleach","hunter-x-hunter","solo-leveling","blue-lock","death-note"]));
    expect(new Set(storefrontTaxonomy.map(category=>category.slug)).size).toBe(storefrontTaxonomy.length);
    expect(storefrontTaxonomy.every(category=>Boolean(category.imageUrl))).toBe(true);
  });
  it("uses product categories and franchises together without confusing them",()=>{
    const shirt={...products[0],id:"test-shirt",collection:"naruto",productCategory:"t-shirts"};
    const figure={...products[1],collection:"naruto",productCategory:"action-figures"};
    expect(discover([shirt,figure],{...emptyFilters,collection:"naruto",category:"t-shirts"},"featured")).toEqual([shirt]);
    expect(paginate(discover([shirt,figure],{...emptyFilters,category:"keychains"},"featured"),9)).toMatchObject({page:1,total:0,from:0,to:0});
  });
  it("routes newly created product categories and franchises without hard-coded pages",()=>{
    expect(categoryHref({...fallbackCategories[0],slug:"hoodies",kind:"PRODUCT_TYPE"})).toBe("/categories/hoodies");
    expect(categoryHref({...fallbackCategories[0],slug:"pokemon",kind:"FRANCHISE"})).toBe("/collections/pokemon");
  });
});

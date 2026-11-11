import { uploadProductImages } from "../src/lib/commerce-api";
afterEach(() => jest.restoreAllMocks());
it("uploads a multi-photo selection in individual multipart requests", async () => {
  const fetcher = jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const body = init?.body as FormData;
    expect(body.getAll("files")).toHaveLength(1);
    expect(new Headers(init?.headers).has("content-type")).toBe(false);
    return new Response(JSON.stringify([{id: (body.get("files") as File).name}]), {status:201});
  });
  const form = new FormData(); form.append("files",new Blob(["one"], {type:"image/png"}),"one.png"); form.append("files",new Blob(["two"], {type:"image/png"}),"two.png");
  const images = await uploadProductImages("test-token", "product", form);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(images.map(image=>image.id)).toEqual(["one.png","two.png"]);
});
it("reports partial success without retrying already saved photos", async () => {
  const fetcher=jest.spyOn(global,"fetch").mockResolvedValueOnce(new Response(JSON.stringify([{id:"one"}]), {status:201})).mockResolvedValueOnce(new Response(JSON.stringify({message:"Storage denied"}),{status:503}));
  const form=new FormData();for(const name of ["one","two","three"])form.append("files",new Blob([name]),name+".png");
  await expect(uploadProductImages("test-token","product",form)).rejects.toThrow("1 of 3 photographs uploaded. Storage denied");
  expect(fetcher).toHaveBeenCalledTimes(2);
});

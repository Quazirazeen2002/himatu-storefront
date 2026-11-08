import { createApplication } from "./bootstrap";
async function main() {
  const app = await createApplication();
  await app.listen(Number(process.env.PORT || 4000));
}
void main();

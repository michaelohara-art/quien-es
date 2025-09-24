import { updateSchema } from "Data/data";

export default async function Game() {
  await updateSchema();

  return (
    <div className="container">
      updated database
    </div>
  );
}

import { Link } from "remix";

export default function NotFound() {
  return (
    <main>
      <h1>Not found :(</h1>
      <p>
        <Link to="/">Go back to home</Link>
      </p>
    </main>
  );
}

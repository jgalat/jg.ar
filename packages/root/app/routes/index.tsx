import Link from '~/components/link';

export default function Index() {
  return (
    <main>
      <h1>Jorge Galat</h1>
      <p>I'm a full stack developer based in Rosario, Argentina</p>
      <ul>
        <li>
          <Link href="https://github.com/jgalat" />
        </li>
        <li>
          <Link href="https://linkedin.com/in/jgalat" />
        </li>
        <li>
          <Link href="https://twitter.com/_jgalat" />
        </li>
      </ul>
    </main>
  );
}

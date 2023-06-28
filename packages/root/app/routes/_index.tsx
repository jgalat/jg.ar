import Link from "~/components/link";
import { UL, LI } from "~/components/list";

export default function Index() {
  return (
    <div className="flex flex-col space-y-8">
      <h1 className="font-serif text-justify text-7xl font-bold tracking-wider uppercase text-shadow-3d">
        Jorge Galat
      </h1>
      <p className="text-lg uppercase tracking-wider">I am (not) a software engineer</p>
      <UL>
        <LI>
          <Link href="https://github.com/jgalat">GitHub</Link>
        </LI>
        <LI>
          <Link href="https://linkedin.com/in/jgalat">LinkedIn</Link>
        </LI>
        <LI>
          <Link href="https://twitter.com/_jgalat">Twitter</Link>
        </LI>
      </UL>
    </div>
  );
}

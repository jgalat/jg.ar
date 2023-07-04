import type { Index } from "~/index.server";
import * as format from "~/utils/format";
import * as magnet from "~/utils/magnet";
import Link from "./link";

type Props = {
  hits: Index.Hit[];
} & React.HTMLProps<HTMLTableElement>;

export default function Table({ hits, ...props }: Props) {
  console.log(hits);
  return (
    <table className="min-w-full" {...props}>
      <thead>
        <tr>
          <th className="py-3 border-b-2 text-left leading-4">Title</th>
          <th className="py-3 pl-2 border-b-2 text-left text-sm leading-4">Size</th>
        </tr>
      </thead>
      <tbody>
        {hits.map((hit) => (
          <tr key={hit._id}>
            <td className="py-4 whitespace-nowrap border-b text-sm w-full max-w-[200px] text-ellipsis overflow-x-hidden">
              <Link to={magnet.link(hit._source)}>{hit._source.title}</Link>
            </td>
            <td className="py-4 pl-2 whitespace-nowrap border-b text-sm">
              {hit._source.size === null
                ? "N/A"
                : format.size(hit._source.size)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { Link as RemixLink, type LinkProps } from "@remix-run/react";
import { clsx } from "clsx";

export default function Link({ className, ...props }: LinkProps) {
  return (
    <RemixLink
      className={clsx(
        `underline decoration-dotted underline-offset-4 hover:text-pink-500 hover:decoration-solid focus:decoration-solid focus:text-pink-500 focus:decoration-pink-500 focus:outline-none`,
        className
      )}
      {...props}
    />
  );
}

export default function Link({
  children,
  ...props
}: React.HTMLProps<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className="underline underline-offset-4 focus:outline outline-1 outline-offset-8 outline-black dark:outline-white"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

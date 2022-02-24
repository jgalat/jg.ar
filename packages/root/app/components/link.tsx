interface LinkProps {
  href: string;
}

export default function Link({ href }: LinkProps) {
  return (
    <a target="_blank" href={href} rel="noreferrer">
      {href}
    </a>
  );
}

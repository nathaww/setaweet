import { cn } from "@/lib/utils";

type ContainerProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/** Max-width container with fluid gutters (see .container-app). */
export function Container<T extends React.ElementType = "div">({
  as,
  className,
  children,
  ...props
}: ContainerProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag className={cn("container-app", className)} {...props}>
      {children}
    </Tag>
  );
}

/**
 * Placeholder body for pages whose final content is still being prepared.
 * Keeps the route live (no 404) and clearly signals "in progress" rather than
 * shipping invented copy.
 */
export function ScaffoldNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="container-app mt-14 md:mt-20">
      <div className="max-w-2xl rounded-lg border border-dashed border-faint bg-coal/40 p-8 md:p-10">
        <p className="slab micro text-teal">In preparation</p>
        <p className="mt-4 text-lead text-paper/70">
          {children ?? "This section is being prepared. Content is coming soon."}
        </p>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { ProjectReader } from "@/components/sections/ProjectReader";
import { projects, projectsBySlug } from "@/data";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectsBySlug[slug];
  if (!project) return {};
  return buildMetadata({ title: project.title, path: `/projects/${slug}` });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) notFound();
  const next = projects[(i + 1) % projects.length];
  return <ProjectReader project={projects[i]} next={next} />;
}

import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <section className={cn("soft-card rounded-[22px] p-6", className)}>{children}</section>;
}

export function CardHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1 text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">{eyebrow}</p> : null}
        <h2 className="font-editorial text-3xl font-semibold text-[#2f2924]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

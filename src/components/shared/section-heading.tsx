import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  centered = true,
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12",
        centered && "text-center",
        className
      )}
    >
      <h2
        className={cn(
          "text-3xl sm:text-4xl font-bold tracking-tight",
          light ? "text-white" : "text-[hsl(215,50%,12%)]"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 text-lg",
            light ? "text-white/70" : "text-[hsl(215,15%,45%)]"
          )}
        >
          {subtitle}
        </p>
      )}
      <div
        className={cn(
          "mt-4 h-1 w-16 rounded-full",
          centered && "mx-auto",
          light ? "bg-[hsl(45,100%,50%)]" : "bg-[hsl(213,90%,45%)]"
        )}
      />
    </div>
  );
}

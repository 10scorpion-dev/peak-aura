type CategoryStyles = {
  badge: string;
  dot: string;
  border: string;
  text: string;
};

const defaultStyles: CategoryStyles = {
  badge: "border-slate-400/15 bg-slate-400/10 text-slate-200",
  dot: "bg-slate-300",
  border: "border-l-slate-400/18",
  text: "text-slate-300",
};

function normalizeCategory(category?: string | null): string {
  return (category ?? "").trim().toLowerCase();
}

export function getCategoryStyles(category?: string | null): CategoryStyles {
  const normalized = normalizeCategory(category);

  if (normalized.includes("dbe") || normalized.includes("study")) {
    return {
      badge: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
      dot: "bg-cyan-300",
      border: "border-l-cyan-400/28",
      text: "text-cyan-200/85",
    };
  }

  if (
    normalized.includes("fitness") ||
    normalized.includes("gym") ||
    normalized.includes("cardio") ||
    normalized.includes("mobility")
  ) {
    return {
      badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
      dot: "bg-emerald-300",
      border: "border-l-emerald-400/28",
      text: "text-emerald-200/85",
    };
  }

  if (normalized.includes("golf")) {
    return {
      badge: "border-amber-400/20 bg-amber-400/10 text-amber-100",
      dot: "bg-amber-300",
      border: "border-l-amber-400/28",
      text: "text-amber-200/85",
    };
  }

  if (normalized.includes("coffee")) {
    return {
      badge: "border-orange-400/20 bg-orange-400/10 text-orange-100",
      dot: "bg-orange-300",
      border: "border-l-orange-400/28",
      text: "text-orange-200/85",
    };
  }

  if (normalized.includes("calorie")) {
    return {
      badge: "border-rose-400/20 bg-rose-400/10 text-rose-100",
      dot: "bg-rose-300",
      border: "border-l-rose-400/28",
      text: "text-rose-200/85",
    };
  }

  if (normalized.includes("office")) {
    return {
      badge: "border-violet-400/20 bg-violet-400/10 text-violet-100",
      dot: "bg-violet-300",
      border: "border-l-violet-400/28",
      text: "text-violet-200/85",
    };
  }

  if (normalized.includes("recovery")) {
    return {
      badge: "border-teal-400/20 bg-teal-400/10 text-teal-100",
      dot: "bg-teal-300",
      border: "border-l-teal-400/28",
      text: "text-teal-200/85",
    };
  }

  if (normalized.includes("sleep")) {
    return {
      badge: "border-indigo-400/20 bg-indigo-400/10 text-indigo-100",
      dot: "bg-indigo-300",
      border: "border-l-indigo-400/28",
      text: "text-indigo-200/85",
    };
  }

  if (normalized.includes("admin")) {
    return {
      badge: "border-slate-500/20 bg-slate-500/10 text-slate-200",
      dot: "bg-slate-400",
      border: "border-l-slate-500/28",
      text: "text-slate-300",
    };
  }

  return defaultStyles;
}

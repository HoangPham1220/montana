export default function CategoryDot({ icon, color }: { icon: string; color: string }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
      style={{ backgroundColor: `${color}26`, boxShadow: `inset 0 0 0 2px ${color}` }}
    >
      {icon}
    </span>
  )
}

export default function CategoryDot({ icon, color }: { icon: string; color: string }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
      style={{ backgroundColor: `${color}26` }}
    >
      {icon}
    </span>
  )
}
